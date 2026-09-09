import { Prisma, type PrismaClient } from '@/generated/prisma/client';
import { BadRequestError } from '../../../../error-handlling/badRequestError';
import type { CartTotalsResult, VoucherSummary } from '../../applications/dto';
import type { IDiscountVoucherRepository } from '../../applications/ports/output';

export class PrismaVoucherRepository implements IDiscountVoucherRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findActive(now: Date): Promise<VoucherSummary[]> {
    const rows = await this.prisma.discount.findMany({
      where: {
        isActive: true,
        startAt: { lte: now },
        endAt: { gte: now },
      },
      orderBy: [{ endAt: 'asc' }, { createdAt: 'desc' }],
      include: { includedCategories: true, excludedCategories: true, includedProducts: true, excludedProducts: true, memberTiers: true },
    });

    return rows.map((row) => this.toSummary(row));
  }

  async findByCode(code: string, tx?: Prisma.TransactionClient): Promise<VoucherSummary | null> {
    const client = tx ?? this.prisma;
    const row = await client.discount.findUnique({ where: { code: code.trim().toUpperCase() }, include: { includedCategories: true, excludedCategories: true, includedProducts: true, excludedProducts: true, memberTiers: true } });
    return row ? this.toSummary(row) : null;
  }

  async countUserUsage(
    discountId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const client = tx ?? this.prisma;
    return client.discountUsage.count({ where: { discountId, userId } });
  }

  async countUserUsageForYear(
    discountId: string,
    userId: string,
    year: number,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const client = tx ?? this.prisma;
    return client.discountUsage.count({ where: { discountId, userId, usageYear: year } });
  }

  async countUserVoucherOrdersForYear(
    discountId: string,
    userId: string,
    year: number,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const client = tx ?? this.prisma;
    return client.order.count({
      where: {
        discountId,
        userId,
        createdAt: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
        status: { notIn: ['CANCELLED', 'RETURNED'] },
        OR: [
          { payment: null },
          { payment: { status: { notIn: ['FAILED', 'EXPIRED'] } } },
        ],
      },
    });
  }

  async getCartTotals(
    userId: string,
    cartItemIds?: string[],
    tx?: Prisma.TransactionClient,
  ): Promise<CartTotalsResult> {
    const client = tx ?? this.prisma;

    const cart = await client.cart.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!cart) {
      throw new BadRequestError('Cart not found for checkout');
    }

    const items = await client.cartItem.findMany({
      where: {
        cartId: cart.id,
        ...(cartItemIds && cartItemIds.length > 0 ? { id: { in: cartItemIds } } : {}),
      },
      select: {
        id: true,
        productId: true,
        variantId: true,
        quantity: true,
        variant: { select: { price: true } },
        product: { select: { categories: { select: { categoryId: true } } } },
      },
    });

    if (items.length === 0) {
      throw new BadRequestError('Cart is empty');
    }

    const categories = await client.category.findMany({ select: { id: true, parentId: true } });
    const parentById = new Map(categories.map((category) => [category.id, category.parentId]));
    const ancestorsOf = (ids: string[]): string[] => {
      const result = new Set<string>();
      for (const id of ids) {
        let parent = parentById.get(id);
        while (parent && !result.has(parent)) { result.add(parent); parent = parentById.get(parent); }
      }
      return [...result];
    };
    const normalizedItems = items.map((item) => {
      if (!item.variantId || !item.variant) {
        throw new BadRequestError(`Cart item ${item.id} missing required variant`);
      }

      const categoryIds = item.product.categories.map((row) => row.categoryId);
      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: Number(item.variant.price),
        categoryIds,
        ancestorCategoryIds: ancestorsOf(categoryIds),
      };
    });

    const subtotal = normalizedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    const [account, user] = await Promise.all([
      client.loyaltyAccount.findUnique({ where: { userId }, select: { tier: true } }),
      client.user.findUnique({ where: { id: userId }, select: { birthday: true } }),
    ]);
    return {
      cartId: cart.id,
      subtotal,
      items: normalizedItems,
      memberTier: account?.tier ?? 'MEMBER',
      userBirthday: user?.birthday ?? null,
    };
  }

  async getOrderVoucher(
    orderId: string,
    tx: Prisma.TransactionClient,
  ): Promise<{
    discountId: string | null;
    userId: string;
    discount: VoucherSummary | null;
  } | null> {
    const row = await tx.order.findUnique({
      where: { id: orderId },
      select: { discountId: true, userId: true, discount: { include: { includedCategories: true, excludedCategories: true, includedProducts: true, excludedProducts: true, memberTiers: true } } },
    });

    return row
      ? {
          discountId: row.discountId,
          userId: row.userId,
          discount: row.discount ? this.toSummary(row.discount) : null,
        }
      : null;
  }

  async hasDiscountUsage(orderId: string, tx: Prisma.TransactionClient): Promise<boolean> {
    const row = await tx.discountUsage.findUnique({
      where: { orderId },
      select: { id: true },
    });
    return Boolean(row);
  }

  async createDiscountUsage(params: {
    discountId: string;
    userId: string;
    orderId: string;
    usageYear?: number | null;
    tx: Prisma.TransactionClient;
  }): Promise<void> {
    await params.tx.discountUsage.create({
      data: {
        discountId: params.discountId,
        userId: params.userId,
        orderId: params.orderId,
        usageYear: params.usageYear ?? null,
      },
    });
  }

  async incrementUsedCountIfAvailable(
    discountId: string,
    tx: Prisma.TransactionClient,
  ): Promise<boolean> {
    const now = new Date();
    const updated = await tx.discount.updateMany({
      where: {
        id: discountId,
        isActive: true,
        startAt: { lte: now },
        endAt: { gte: now },
        OR: [{ maxUsage: null }, { usedCount: { lt: tx.discount.fields.maxUsage } }],
      },
      data: { usedCount: { increment: 1 } },
    });

    return updated.count > 0;
  }

  private toSummary(row: {
    id: string;
    code: string;
    description: string | null;
    type: any;
    value: Prisma.Decimal;
    maxDiscount: Prisma.Decimal | null;
    minOrderAmount: Prisma.Decimal | null;
    maxUsage: number | null;
    userUsageLimit: number | null;
    usedCount: number;
    startAt: Date;
    endAt: Date;
    isActive: boolean;
    isBirthdayVoucher?: boolean;
    bannerImageUrl: string | null;
    scopeType: any;
    includeDescendants: boolean;
    minAmountBasis: any;
    includedCategories?: Array<{ categoryId: string }>;
    excludedCategories?: Array<{ categoryId: string }>;
    includedProducts?: Array<{ productId: string }>;
    excludedProducts?: Array<{ productId: string }>;
    memberTiers?: Array<{ tier: string }>;
  }): VoucherSummary {
    return {
      id: row.id,
      code: row.code,
      description: row.description,
      type: row.type,
      value: Number(row.value),
      maxDiscount: row.maxDiscount ? Number(row.maxDiscount) : null,
      minOrderAmount: row.minOrderAmount ? Number(row.minOrderAmount) : null,
      maxUsage: row.maxUsage,
      userUsageLimit: row.userUsageLimit,
      usedCount: row.usedCount,
      startAt: row.startAt,
      endAt: row.endAt,
      isActive: row.isActive,
      isBirthdayVoucher: row.isBirthdayVoucher ?? false,
      bannerImageUrl: row.bannerImageUrl,
      scopeType: row.scopeType,
      includeDescendants: row.includeDescendants,
      minAmountBasis: row.minAmountBasis,
      includedCategoryIds: row.includedCategories?.map((item) => item.categoryId) ?? [],
      excludedCategoryIds: row.excludedCategories?.map((item) => item.categoryId) ?? [],
      includedProductIds: row.includedProducts?.map((item) => item.productId) ?? [],
      excludedProductIds: row.excludedProducts?.map((item) => item.productId) ?? [],
      memberTiers: row.memberTiers?.map((item) => item.tier) ?? [],
    };
  }
}
