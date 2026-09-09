import type { Prisma } from '@/generated/prisma/client';
import type { PromotionScopeType, PromotionType } from '@/generated/prisma/enums';
import type { CartItemPricing } from '../voucher/applications/dto/voucher.dto';

export type PromotionCartItem = CartItemPricing & {
  quantity: number;
  unitPrice: number;
};

export type PromotionAllocation = {
  cartItemId: string;
  promotionId: string | null;
  promotionName: string | null;
  discountAmount: number;
  stackableWithVoucher: boolean;
  snapshot: Prisma.InputJsonValue | null;
};

type ActivePromotion = {
  id: string;
  name: string;
  type: PromotionType;
  status: string;
  scopeType: PromotionScopeType;
  includeDescendants: boolean;
  value: unknown;
  maxDiscount: unknown;
  priority: number;
  usageLimit: number | null;
  usedCount: number;
  stackableWithVoucher: boolean;
  startAt: Date;
  endAt: Date;
  includedProducts?: Array<{ productId: string }>;
  includedCategories?: Array<{ categoryId: string }>;
};

function toMoney(value: unknown): number {
  return Math.max(0, Math.round(Number(value ?? 0)));
}

function isEligible(promotion: ActivePromotion, item: PromotionCartItem): boolean {
  if (promotion.scopeType === 'ALL_PRODUCTS') return true;
  if (promotion.scopeType === 'INCLUDE_PRODUCTS') {
    return (promotion.includedProducts ?? []).some((row) => row.productId === item.productId);
  }
  const categoryIds = promotion.includeDescendants
    ? [...item.categoryIds, ...item.ancestorCategoryIds]
    : item.categoryIds;
  return categoryIds.some((id) =>
    (promotion.includedCategories ?? []).some((row) => row.categoryId === id),
  );
}

function calculateLineDiscount(
  promotion: ActivePromotion,
  lineSubtotal: number,
  unitPrice: number,
  quantity: number,
): number {
  const value = toMoney(promotion.value);
  let discount = 0;

  if (promotion.type === 'PERCENTAGE') {
    discount = Math.floor((lineSubtotal * value) / 100);
    const maxDiscount = promotion.maxDiscount === null ? null : toMoney(promotion.maxDiscount);
    if (maxDiscount !== null && maxDiscount > 0) discount = Math.min(discount, maxDiscount);
  } else if (promotion.type === 'FIXED_AMOUNT') {
    discount = value;
  } else if (promotion.type === 'SALE_PRICE') {
    discount = Math.max(0, (unitPrice - value) * quantity);
  } else {
    discount = 0;
  }

  return Math.min(lineSubtotal, Math.max(0, Math.round(discount)));
}

export class PromotionPricingService {
  async calculateForCart(params: {
    tx: Prisma.TransactionClient;
    items: PromotionCartItem[];
    now?: Date;
  }): Promise<{ totalDiscount: number; allocations: PromotionAllocation[] }> {
    const now = params.now ?? new Date();
    const promotions = await params.tx.promotion.findMany({
      where: {
        status: { in: ['ACTIVE', 'SCHEDULED'] },
        startAt: { lte: now },
        endAt: { gte: now },
      },
      include: {
        includedProducts: true,
        includedCategories: true,
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });

    const allocations = params.items.map((item) => {
      const lineSubtotal = item.unitPrice * item.quantity;
      let best: PromotionAllocation = {
        cartItemId: item.id,
        promotionId: null,
        promotionName: null,
        discountAmount: 0,
        stackableWithVoucher: true,
        snapshot: null,
      };

      for (const promotion of promotions as ActivePromotion[]) {
        if (promotion.usageLimit !== null && promotion.usedCount >= promotion.usageLimit) continue;
        if (!isEligible(promotion, item)) continue;
        const discountAmount = calculateLineDiscount(
          promotion,
          lineSubtotal,
          item.unitPrice,
          item.quantity,
        );
        if (discountAmount <= 0) continue;

        const shouldReplace =
          discountAmount > best.discountAmount ||
          (discountAmount === best.discountAmount && best.promotionId === null);
        if (shouldReplace) {
          best = {
            cartItemId: item.id,
            promotionId: promotion.id,
            promotionName: promotion.name,
            discountAmount,
            stackableWithVoucher: promotion.stackableWithVoucher,
            snapshot: {
              id: promotion.id,
              name: promotion.name,
              type: promotion.type,
              value: toMoney(promotion.value),
              priority: promotion.priority,
              stackableWithVoucher: promotion.stackableWithVoucher,
            },
          };
        }
      }

      return best;
    });

    return {
      allocations,
      totalDiscount: allocations.reduce((sum, item) => sum + item.discountAmount, 0),
    };
  }

  async recordUsageForOrder(
    tx: Prisma.TransactionClient,
    orderId: string,
  ): Promise<void> {
    const rows = await tx.orderItem.groupBy({
      by: ['promotionId'],
      where: { orderId, promotionId: { not: null }, promotionDiscountAmount: { gt: 0 } },
      _sum: { promotionDiscountAmount: true },
    });

    for (const row of rows) {
      if (!row.promotionId) continue;
      const idempotencyKey = `PROMOTION:${row.promotionId}:ORDER:${orderId}`;
      const exists = await tx.promotionUsage.findUnique({ where: { idempotencyKey } });
      if (exists) continue;

      const incremented = await tx.$executeRaw`
        UPDATE promotions
        SET used_count = used_count + 1
        WHERE id = ${row.promotionId}
          AND (usage_limit IS NULL OR used_count < usage_limit)
      `;
      if (incremented !== 1) continue;

      await tx.promotionUsage.create({
        data: {
          promotionId: row.promotionId,
          orderId,
          discountAmount: row._sum.promotionDiscountAmount ?? 0,
          idempotencyKey,
        },
      });
    }
  }
}
