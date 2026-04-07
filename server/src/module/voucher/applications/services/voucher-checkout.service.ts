import { BadRequestError } from '../../../../error-handlling/badRequestError';
import type { Prisma } from '@/generated/prisma/client';
import { VoucherRulesService } from './voucher-rules.service';
import type { IDiscountVoucherRepository } from '../ports/output/voucher.repository';

export interface CheckoutVoucherResult {
  subtotalAmount: number;
  discountAmount: number;
  payableAmount: number;
  appliedVoucherId?: string;
  appliedVoucherCode?: string;
  cartId: string;
  itemIds: string[];
}

export class VoucherCheckoutService {
  constructor(private readonly voucherRepository: IDiscountVoucherRepository) {}

  async calculateForCheckout(params: {
    userId: string;
    amount: number;
    voucherCode?: string;
    cartItemIds?: string[];
    tx?: Prisma.TransactionClient;
  }): Promise<CheckoutVoucherResult> {
    const cartTotals = await this.voucherRepository.getCartTotals(
      params.userId,
      params.cartItemIds,
      params.tx,
    );

    let discountAmount = 0;
    let payableAmount = Math.round(cartTotals.subtotal);
    let appliedVoucherId: string | undefined;
    let appliedVoucherCode: string | undefined;

    if (params.voucherCode) {
      const voucher = await this.voucherRepository.findByCode(params.voucherCode, params.tx);
      if (!voucher) {
        throw new BadRequestError('Voucher does not exist');
      }

      VoucherRulesService.ensureVoucherIsApplicable(voucher, cartTotals.subtotal);
      const userUsageCount = await this.voucherRepository.countUserUsage(
        voucher.id,
        params.userId,
        params.tx,
      );

      if (voucher.userUsageLimit !== null && userUsageCount >= voucher.userUsageLimit) {
        throw new BadRequestError('Voucher usage limit per user exceeded');
      }

      const pricing = VoucherRulesService.calculatePrice(voucher.type, voucher.value, {
        subtotal: cartTotals.subtotal,
        maxDiscount: voucher.maxDiscount,
      });

      discountAmount = pricing.discountAmount;
      payableAmount = pricing.finalTotal;
      appliedVoucherId = voucher.id;
      appliedVoucherCode = voucher.code;
    }

    if (payableAmount !== Math.round(params.amount)) {
      throw new BadRequestError('Checkout amount is outdated. Please refresh and try again.');
    }

    return {
      subtotalAmount: Math.round(cartTotals.subtotal),
      discountAmount,
      payableAmount,
      appliedVoucherId,
      appliedVoucherCode,
      cartId: cartTotals.cartId,
      itemIds: cartTotals.items.map((item) => item.id),
    };
  }

  async recordUsageForPaidOrder(tx: Prisma.TransactionClient, orderId: string): Promise<void> {
    const order = await this.voucherRepository.getOrderVoucher(orderId, tx);
    if (!order?.discountId) {
      return;
    }

    const exists = await this.voucherRepository.hasDiscountUsage(orderId, tx);
    if (exists) {
      return;
    }

    await this.voucherRepository.createDiscountUsage({
      discountId: order.discountId,
      userId: order.userId,
      orderId,
      tx,
    });

    await this.voucherRepository.incrementUsedCount(order.discountId, tx);
  }
}
