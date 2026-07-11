import dotenv from 'dotenv';
import { prisma, PrismaService, redis, redisService } from './infrastructure/database';
import { createLogger } from './shared/util/logger';
import { EmailSender } from './module/auth/infrastructure/email';
import { BirthdayVoucherCronService } from './module/voucher/applications/services/birthday-voucher-cron.service';

const logger = createLogger('BirthdayVoucherWorker');

type WorkerConfig = {
  intervalMs: number;
  batchSize: number;
  lockKey: string;
  lockTtlMs: number;
};

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function getConfig(): WorkerConfig {
  return {
    intervalMs: clampInt(
      process.env.BIRTHDAY_VOUCHER_INTERVAL_MS,
      60 * 60 * 1000,
      60_000,
      24 * 60 * 60 * 1000,
    ),
    batchSize: clampInt(process.env.BIRTHDAY_VOUCHER_BATCH_SIZE, 200, 1, 1000),
    lockKey: process.env.BIRTHDAY_VOUCHER_LOCK_KEY?.trim() || 'locks:birthday-voucher',
    lockTtlMs: clampInt(
      process.env.BIRTHDAY_VOUCHER_LOCK_TTL_MS,
      10 * 60 * 1000,
      60_000,
      60 * 60 * 1000,
    ),
  };
}

function createLockValue(): string {
  return `${process.pid}:${Date.now()}:${Math.random().toString(16).slice(2)}`;
}

async function acquireLock(key: string, value: string, ttlMs: number): Promise<boolean> {
  const result = await (redis as any).set(key, value, 'PX', ttlMs, 'NX');
  return result === 'OK';
}

async function releaseLock(key: string, value: string): Promise<void> {
  const lua = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

  try {
    await (redis as any).eval(lua, 1, key, value);
  } catch (error) {
    logger.warn('Failed to release birthday voucher lock', {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function runTick(config: WorkerConfig, service: BirthdayVoucherCronService): Promise<void> {
  const lockValue = createLockValue();
  const hasLock = await acquireLock(config.lockKey, lockValue, config.lockTtlMs);
  if (!hasLock) {
    logger.info('Skip tick: lock is held by another worker', { lockKey: config.lockKey });
    return;
  }

  const startedAt = Date.now();
  try {
    const result = await service.runOnce(new Date(), config.batchSize);
    logger.info('Birthday voucher tick done', {
      ...result,
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
  const service = new BirthdayVoucherCronService(prisma, new EmailSender());
  logger.info('Birthday voucher worker starting', { env, config });

  try {
    await redis.ping();
  } catch (error) {
    logger.warn('Redis ping failed (will retry on next tick)', {
      error: error instanceof Error ? error.message : String(error),
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
      await runTick(config, service);
    } catch (error) {
      logger.error('Birthday voucher tick crashed', {
        error: error instanceof Error ? error.message : String(error),
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
    logger.info('Birthday voucher worker shutting down', { signal });
    clearInterval(timer);

    try {
      await PrismaService.disconnect();
    } catch (error) {
      logger.warn('Failed to disconnect prisma', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    try {
      await redisService.disconnect();
    } catch (error) {
      logger.warn('Failed to disconnect redis', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

void main();
