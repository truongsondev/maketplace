import type { Prisma } from '@/generated/prisma/client';
import type { CartTotalsResult, VoucherSummary } from '../../dto/voucher.dto';

export interface IDiscountVoucherRepository {
  findActive(now: Date): Promise<VoucherSummary[]>;
  findByCode(code: string, tx?: Prisma.TransactionClient): Promise<VoucherSummary | null>;
  countUserUsage(
    discountId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<number>;
  getCartTotals(
    userId: string,
    cartItemIds?: string[],
    tx?: Prisma.TransactionClient,
  ): Promise<CartTotalsResult>;
  getOrderVoucher(
    orderId: string,
    tx: Prisma.TransactionClient,
  ): Promise<{ discountId: string | null; userId: string } | null>;
  hasDiscountUsage(orderId: string, tx: Prisma.TransactionClient): Promise<boolean>;
  createDiscountUsage(params: {
    discountId: string;
    userId: string;
    orderId: string;
    tx: Prisma.TransactionClient;
  }): Promise<void>;
  incrementUsedCount(discountId: string, tx: Prisma.TransactionClient): Promise<void>;
}
