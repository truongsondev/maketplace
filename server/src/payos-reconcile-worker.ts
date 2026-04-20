import dotenv from 'dotenv';
import { prisma, PrismaService, redis, redisService } from './infrastructure/database';
import { createLogger } from './shared/util/logger';
import { getPayosClient } from './module/payment/infrastructure/payos/payos.client';
import { PrismaPaymentRepository } from './module/payment/infrastructure/repositories';
import { createVoucherCheckoutService } from './module/voucher/di';
import { AdminPaymentSuccessNotifier } from './module/payment/infrastructure/notifiers/admin-payment-success.notifier';

const logger = createLogger('PayosReconcileWorker');

type WorkerConfig = {
  intervalMs: number;
  batchSize: number;
  concurrency: number;
  minAgeSeconds: number;
  maxAgeHours: number;
  lockKey: string;
  lockTtlMs: number;
};

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.floor(n);
  return Math.min(max, Math.max(min, i));
}

function getConfig(): WorkerConfig {
  return {
    intervalMs: clampInt(process.env.PAYOS_RECONCILE_INTERVAL_MS, 60_000, 5_000, 10 * 60_000),
    batchSize: clampInt(process.env.PAYOS_RECONCILE_BATCH_SIZE, 50, 1, 500),
    concurrency: clampInt(process.env.PAYOS_RECONCILE_CONCURRENCY, 6, 1, 25),
    minAgeSeconds: clampInt(process.env.PAYOS_RECONCILE_MIN_AGE_SECONDS, 30, 0, 60 * 10),
    maxAgeHours: clampInt(process.env.PAYOS_RECONCILE_MAX_AGE_HOURS, 24, 1, 24 * 30),
    lockKey: process.env.PAYOS_RECONCILE_LOCK_KEY?.trim() || 'locks:payos-reconcile',
    lockTtlMs: clampInt(process.env.PAYOS_RECONCILE_LOCK_TTL_MS, 55_000, 5_000, 10 * 60_000),
  };
}

function createLockValue(): string {
  return `${process.pid}:${Date.now()}:${Math.random().toString(16).slice(2)}`;
}

async function acquireLock(key: string, value: string, ttlMs: number): Promise<boolean> {
  // ioredis SET key value PX ttl NX
  const result = await (redis as any).set(key, value, 'PX', ttlMs, 'NX');
  return result === 'OK';
}

async function releaseLock(key: string, value: string): Promise<void> {
  // Release only if value matches.
  const lua = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

  try {
    await (redis as any).eval(lua, 1, key, value);
  } catch (err) {
    logger.warn('Failed to release redis lock (will expire by TTL)', {
      key,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

async function mapWithConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let index = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const current = index++;
      if (current >= items.length) return;
      await fn(items[current]);
    }
  });

  await Promise.all(workers);
}

async function reconcileOnce(config: WorkerConfig): Promise<void> {
  const lockValue = createLockValue();
  const hasLock = await acquireLock(config.lockKey, lockValue, config.lockTtlMs);

  if (!hasLock) {
    logger.info('Skip tick: lock is held by another worker', { lockKey: config.lockKey });
    return;
  }

  const startedAt = Date.now();

  try {
    const now = Date.now();
    const minCreatedAt = new Date(now - config.maxAgeHours * 60 * 60 * 1000);
    const maxCreatedAt = new Date(now - config.minAgeSeconds * 1000);

    const pending = await prisma.paymentTransaction.findMany({
      where: {
        status: 'PENDING',
        // createdAt: {
        //   gte: minCreatedAt,
        //   lte: maxCreatedAt,
        // },
      },
      select: {
        orderCode: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: config.batchSize,
    });

    if (pending.length === 0) {
      logger.info('No pending transactions to reconcile');
      return;
    }

    const voucherCheckoutService = createVoucherCheckoutService();
    const paymentRepository = new PrismaPaymentRepository(prisma, voucherCheckoutService);
    const paymentSuccessNotifier = new AdminPaymentSuccessNotifier(prisma);
    const payos = getPayosClient();

    let updatedCount = 0;
    let checkedCount = 0;

    await mapWithConcurrency(pending, config.concurrency, async (tx) => {
      checkedCount += 1;

      const orderCode = tx.orderCode;
      try {
        const paymentLink = await payos.paymentRequests.get(Number(orderCode));

        const isPaid = paymentLink.status === 'PAID';
        const isExpired = paymentLink.status === 'EXPIRED';
        const isTerminalFailure = ['FAILED', 'CANCELLED', 'EXPIRED'].includes(paymentLink.status);
        if (!isPaid && !isTerminalFailure) {
          return;
        }

        const paidAt = (() => {
          if (!isPaid) return null;

          const raw = (paymentLink as any)?.transactionDateTime;
          if (typeof raw === 'string' && raw.trim()) {
            const parsed = new Date(raw);
            if (!Number.isNaN(parsed.getTime())) return parsed;
          }
          return new Date();
        })();

        const updated = await paymentRepository.updateFromWebhookIfPending({
          orderCode,
          status: isPaid ? 'PAID' : isExpired ? 'EXPIRED' : 'FAILED',
          paymentLinkId: paymentLink.id ?? null,
          gatewayReference: (paymentLink as any)?.reference ?? null,
          gatewayCode: isPaid ? '00' : paymentLink.status,
          bankCode: (paymentLink as any)?.counterAccountBankId ?? null,
          paidAt,
          rawPayload: {
            source: 'cron-reconcile',
            paymentLink,
          },
        });

        if (updated) {
          updatedCount += 1;

          if (isPaid) {
            const payment = await paymentRepository.findByOrderCode(orderCode);
            if (payment && payment.status === 'PAID') {
              try {
                await paymentSuccessNotifier.notify({
                  orderId: payment.orderId,
                  orderCode: payment.orderCode,
                  amount: payment.amount,
                  paidAt: payment.paidAt ?? new Date(),
                });
              } catch (notifyError) {
                logger.warn('Failed to notify admin from reconcile worker', {
                  orderCode,
                  error: notifyError instanceof Error ? notifyError.message : String(notifyError),
                });
              }
            }
          }
        }
      } catch (err) {
        logger.warn('Reconcile failed for orderCode', {
          orderCode,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    });

    logger.info('Reconcile tick done', {
      checkedCount,
      updatedCount,
      batchSize: config.batchSize,
      concurrency: config.concurrency,
      tookMs: Date.now() - startedAt,
    });
  } finally {
    await releaseLock(config.lockKey, lockValue);
  }
}

async function main(): Promise<void> {
  const env = process.env.NODE_ENV || 'development';
  dotenv.config({ path: `.env.${env}` });

  const config = getConfig();
  logger.info('Worker starting', { env, config });

  // Ensure Redis connection is attempted early (lazyConnect is enabled).
  try {
    await redis.ping();
  } catch (err) {
    logger.warn('Redis ping failed (will retry on next tick)', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  let running = false;

  const tick = async () => {
    if (running) {
      logger.info('Skip tick: previous run still in progress');
      return;
    }

    running = true;
    try {
      await reconcileOnce(config);
    } catch (err) {
      logger.error('Reconcile tick crashed', {
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      running = false;
    }
  };

  await tick();
  const timer = setInterval(() => {
    void tick();
  }, config.intervalMs);

  const shutdown = async (signal: string) => {
    logger.info('Worker shutting down', { signal });
    clearInterval(timer);

    try {
      await PrismaService.disconnect();
    } catch (err) {
      logger.warn('Failed to disconnect prisma', {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    try {
      await redisService.disconnect();
    } catch (err) {
      logger.warn('Failed to disconnect redis', {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

void main();
