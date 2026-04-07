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
    });

    return rows.map((row) => this.toSummary(row));
  }

  async findByCode(code: string, tx?: Prisma.TransactionClient): Promise<VoucherSummary | null> {
    const client = tx ?? this.prisma;
    const row = await client.discount.findUnique({ where: { code: code.trim().toUpperCase() } });
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
      },
    });

    if (items.length === 0) {
      throw new BadRequestError('Cart is empty');
    }

    const normalizedItems = items.map((item) => {
      if (!item.variantId || !item.variant) {
        throw new BadRequestError(`Cart item ${item.id} missing required variant`);
      }

      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: Number(item.variant.price),
      };
    });

    const subtotal = normalizedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    return {
      cartId: cart.id,
      subtotal,
      items: normalizedItems,
    };
  }

  async getOrderVoucher(
    orderId: string,
    tx: Prisma.TransactionClient,
  ): Promise<{ discountId: string | null; userId: string } | null> {
    return tx.order.findUnique({
      where: { id: orderId },
      select: { discountId: true, userId: true },
    });
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
    tx: Prisma.TransactionClient;
  }): Promise<void> {
    await params.tx.discountUsage.create({
      data: {
        discountId: params.discountId,
        userId: params.userId,
        orderId: params.orderId,
      },
    });
  }

  async incrementUsedCount(discountId: string, tx: Prisma.TransactionClient): Promise<void> {
    await tx.discount.update({
      where: { id: discountId },
      data: { usedCount: { increment: 1 } },
    });
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
    bannerImageUrl: string | null;
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
      bannerImageUrl: row.bannerImageUrl,
    };
  }
}
