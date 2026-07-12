import type { LoyaltyTransactionType, Prisma, PrismaClient } from '@/generated/prisma/client';
import { BadRequestError } from '../../error-handlling/badRequestError';
import {
  getLoyaltyTierBenefit,
  LOYALTY_TIER_BENEFITS,
  normalizeLoyaltyTier,
} from './loyalty-benefits';

type Db = PrismaClient | Prisma.TransactionClient;

const VALID_TIERS = ['MEMBER', 'SILVER', 'GOLD'] as const;

function normalizeTierByEarnedPoints(points: number, config: {
  silverMinPoints: number;
  goldMinPoints: number;
}): string {
  if (points >= config.goldMinPoints) return 'GOLD';
  if (points >= config.silverMinPoints) return 'SILVER';
  return 'MEMBER';
}

async function getConfig(db: Db) {
  const config = await db.loyaltyConfig.upsert({
    where: { id: 1 },
    create: { id: 1 },
    update: {},
  });
  return config;
}

async function getEarnedLifetimePoints(db: Db, accountId: string): Promise<number> {
  const earned = await db.loyaltyTransaction.aggregate({
    where: { accountId, type: 'EARN' },
    _sum: { points: true },
  });
  return earned._sum.points ?? 0;
}

async function applyTier(db: Db, accountId: string): Promise<void> {
  const config = await getConfig(db);
  const earnedPoints = await getEarnedLifetimePoints(db, accountId);
  const tier = normalizeTierByEarnedPoints(earnedPoints, config);
  await db.loyaltyAccount.update({ where: { id: accountId }, data: { tier } });
}

async function ensureAccount(db: Db, userId: string) {
  return db.loyaltyAccount.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

async function appendLedger(params: {
  db: Db;
  accountId: string;
  type: LoyaltyTransactionType;
  points: number;
  referenceType: string;
  referenceId: string;
  idempotencyKey: string;
  description: string;
  expiresAt?: Date | null;
  sourcePoints?: number | null;
  sourceTransactionId?: string | null;
}): Promise<number> {
  const existing = await params.db.loyaltyTransaction.findUnique({
    where: { idempotencyKey: params.idempotencyKey },
  });
  if (existing) return 0;

  const account = await params.db.loyaltyAccount.findUniqueOrThrow({
    where: { id: params.accountId },
  });
  const nextBalance = account.balance + params.points;
  if (nextBalance < 0) {
    throw new BadRequestError('Loyalty balance cannot be negative');
  }

  const updated = await params.db.loyaltyAccount.updateMany({
    where: { id: params.accountId, balance: account.balance },
    data: { balance: nextBalance },
  });
  if (updated.count !== 1) {
    throw new BadRequestError('Loyalty balance changed, please retry');
  }

  await params.db.loyaltyTransaction.create({
    data: {
      accountId: params.accountId,
      type: params.type,
      points: params.points,
      balanceAfter: nextBalance,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      idempotencyKey: params.idempotencyKey,
      description: params.description,
      expiresAt: params.expiresAt ?? null,
      sourcePoints: params.sourcePoints ?? null,
      sourceTransactionId: params.sourceTransactionId ?? null,
    },
  });

  await applyTier(params.db, params.accountId);
  return params.points;
}

export async function awardLoyaltyForOrder(
  tx: Prisma.TransactionClient,
  orderId: string,
): Promise<number> {
  const service = new LoyaltyMutationService(tx);
  return service.awardForOrder(orderId);
}

export class LoyaltyMutationService {
  constructor(private readonly db: Db) {}

  async awardForOrder(orderId: string): Promise<number> {
    const order = await this.db.order.findUnique({
      where: { id: orderId },
      select: {
        userId: true,
        totalPrice: true,
        grandTotal: true,
        status: true,
        payment: { select: { status: true } },
      },
    });
    if (!order || !['DELIVERED', 'COMPLETED'].includes(order.status)) return 0;
    if (!['PAID', 'SUCCESS'].includes(order.payment?.status ?? '')) return 0;

    const config = await getConfig(this.db);
    if (!config.isActive) return 0;
    const spendPerPoint = Math.max(1, config.spendPerPoint);
    const amount = Math.max(0, Number(order.grandTotal || order.totalPrice));
    const points = Math.floor(amount / spendPerPoint);
    if (points <= 0) return 0;

    const account = await ensureAccount(this.db, order.userId);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Math.max(1, config.pointValidityDays));

    return appendLedger({
      db: this.db,
      accountId: account.id,
      type: 'EARN',
      points,
      referenceType: 'ORDER',
      referenceId: orderId,
      idempotencyKey: `ORDER:${orderId}:EARN`,
      description: 'Tích điểm từ đơn hàng đã hoàn tất',
      expiresAt,
      sourcePoints: points,
    });
  }

  async awardForPhysicalSale(saleId: string, idempotencyKey?: string): Promise<number> {
    const sale = await this.db.physicalSale.findUnique({
      where: { id: saleId },
      select: { id: true, status: true, customerId: true, totalAmount: true },
    });
    if (!sale || sale.status !== 'COMPLETED' || !sale.customerId) return 0;

    const config = await getConfig(this.db);
    if (!config.isActive) return 0;
    const points = Math.floor(Number(sale.totalAmount) / Math.max(1, config.spendPerPoint));
    if (points <= 0) return 0;

    const account = await ensureAccount(this.db, sale.customerId);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Math.max(1, config.pointValidityDays));

    return appendLedger({
      db: this.db,
      accountId: account.id,
      type: 'EARN',
      points,
      referenceType: 'PHYSICAL_SALE',
      referenceId: sale.id,
      idempotencyKey: idempotencyKey ?? `PHYSICAL_SALE:${sale.id}:EARN`,
      description: 'Tích điểm từ giao dịch tại cửa hàng',
      expiresAt,
      sourcePoints: points,
    });
  }

  async reverseForReference(params: {
    referenceType: string;
    referenceId: string;
    amount?: number;
    totalAmount?: number;
    idempotencyKey: string;
    description: string;
  }): Promise<number> {
    const earns = await this.db.loyaltyTransaction.findMany({
      where: {
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        type: 'EARN',
      },
      orderBy: { createdAt: 'asc' },
    });
    const earnedPoints = earns.reduce((sum, tx) => sum + tx.points, 0);
    if (earnedPoints <= 0) return 0;

    const alreadyReversed = await this.db.loyaltyTransaction.aggregate({
      where: {
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        type: 'REVERSE',
      },
      _sum: { points: true },
    });
    const reversedAbs = Math.abs(alreadyReversed._sum.points ?? 0);
    const ratio =
      params.amount !== undefined && params.totalAmount && params.totalAmount > 0
        ? Math.min(1, Math.max(0, params.amount / params.totalAmount))
        : 1;
    const targetReverse = Math.min(earnedPoints, Math.round(earnedPoints * ratio));
    const pointsToReverse = Math.max(0, targetReverse - reversedAbs);
    if (pointsToReverse <= 0) return 0;

    return appendLedger({
      db: this.db,
      accountId: earns[0].accountId,
      type: 'REVERSE',
      points: -pointsToReverse,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      idempotencyKey: params.idempotencyKey,
      description: params.description,
      sourcePoints: pointsToReverse,
      sourceTransactionId: earns[0].id,
    });
  }

  async adjust(params: {
    userId: string;
    points: number;
    reason: string;
    actorId?: string;
    idempotencyKey?: string;
  }): Promise<number> {
    if (!Number.isInteger(params.points) || params.points === 0) {
      throw new BadRequestError('points must be a non-zero integer');
    }
    if (!params.reason.trim()) {
      throw new BadRequestError('Adjustment reason is required');
    }
    const account = await ensureAccount(this.db, params.userId);
    const key =
      params.idempotencyKey ??
      `ADMIN_ADJUST:${params.userId}:${Date.now()}:${Math.abs(params.points)}`;
    return appendLedger({
      db: this.db,
      accountId: account.id,
      type: 'ADJUST',
      points: params.points,
      referenceType: 'ADMIN_ADJUST',
      referenceId: params.actorId ?? 'SYSTEM',
      idempotencyKey: key,
      description: params.reason.trim().slice(0, 255),
      sourcePoints: Math.abs(params.points),
    });
  }

  async expireDuePoints(now = new Date()): Promise<number> {
    const earnRows = await this.db.loyaltyTransaction.findMany({
      where: {
        type: 'EARN',
        expiresAt: { lte: now },
        expiredAt: null,
      },
      orderBy: { expiresAt: 'asc' },
      take: 200,
    });

    let expired = 0;
    for (const earn of earnRows) {
      const key = `LOYALTY_EXPIRE:${earn.id}`;
      const existing = await this.db.loyaltyTransaction.findUnique({
        where: { idempotencyKey: key },
      });
      if (existing) continue;

      const marked = await this.db.loyaltyTransaction.updateMany({
        where: { id: earn.id, expiredAt: null },
        data: { expiredAt: now },
      });
      if (marked.count !== 1) continue;

      const account = await this.db.loyaltyAccount.findUnique({
        where: { id: earn.accountId },
        select: { balance: true },
      });
      const points = Math.min(earn.points, Math.max(0, account?.balance ?? 0));
      if (points <= 0) continue;
      expired += Math.abs(
        await appendLedger({
          db: this.db,
          accountId: earn.accountId,
          type: 'EXPIRE',
          points: -points,
          referenceType: 'LOYALTY_TRANSACTION',
          referenceId: earn.id,
          idempotencyKey: key,
          description: 'Điểm loyalty hết hạn',
          sourcePoints: points,
          sourceTransactionId: earn.id,
        }),
      );
    }
    return expired;
  }
}

export class LoyaltyQueryService {
  constructor(private readonly prisma: PrismaClient) {}

  async getMine(userId: string) {
    const account = await this.prisma.loyaltyAccount.findUnique({
      where: { userId },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 50 } },
    });
    const config = await getConfig(this.prisma);
    const accountId = account?.id;
    const lifetimePoints = accountId ? await getEarnedLifetimePoints(this.prisma, accountId) : 0;
    const tier = normalizeLoyaltyTier(account?.tier);
    const benefit = getLoyaltyTierBenefit(tier);
    const nextTier =
      tier === 'MEMBER'
        ? {
            tier: 'SILVER',
            label: LOYALTY_TIER_BENEFITS.SILVER.label,
            requiredPoints: config.silverMinPoints,
          }
        : tier === 'SILVER'
          ? {
              tier: 'GOLD',
              label: LOYALTY_TIER_BENEFITS.GOLD.label,
              requiredPoints: config.goldMinPoints,
            }
          : null;
    const pointsToNextTier = nextTier
      ? Math.max(0, nextTier.requiredPoints - lifetimePoints)
      : 0;
    return {
      ...(account ?? { userId, balance: 0, tier, transactions: [] }),
      tier,
      tierLabel: benefit.label,
      lifetimePoints,
      nextTier,
      pointsToNextTier,
      benefits: {
        memberDiscountPercent: benefit.discountPercent,
        memberDiscountAppliesAt: 'CHECKOUT',
        birthdayVoucher: {
          included: true,
          label: benefit.birthdayVoucherLabel,
          appearsIn: ['LOYALTY', 'MY_VOUCHERS', 'CHECKOUT'],
          note:
            'Quà sinh nhật là quyền lợi loyalty. Khi hồ sơ có ngày sinh và voucher được phát hành, mã sẽ xuất hiện trong Ví voucher và có thể chọn ở checkout.',
        },
      },
      config: {
        spendPerPoint: config.spendPerPoint,
        pointValidityDays: config.pointValidityDays,
        isActive: config.isActive,
        tiers: VALID_TIERS,
      },
    };
  }

  async getConfig() {
    return getConfig(this.prisma);
  }
}
