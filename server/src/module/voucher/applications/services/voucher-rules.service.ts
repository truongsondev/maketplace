import type { DiscountType } from '@/generated/prisma/enums';
import { BadRequestError } from '../../../../error-handlling/badRequestError';
import type { VoucherPricingResult, VoucherSummary } from '../dto/voucher.dto';

export class VoucherRulesService {
  static ensureVoucherIsApplicable(voucher: VoucherSummary, subtotal: number): void {
    const now = new Date();

    if (!voucher.isActive) {
      throw new BadRequestError('Voucher is inactive');
    }

    if (now < voucher.startAt || now > voucher.endAt) {
      throw new BadRequestError('Voucher is not in active time range');
    }

    if (voucher.maxUsage !== null && voucher.usedCount >= voucher.maxUsage) {
      throw new BadRequestError('Voucher usage limit exceeded');
    }

    if (voucher.minOrderAmount !== null && subtotal < voucher.minOrderAmount) {
      throw new BadRequestError('Order total does not meet minimum value for voucher');
    }

    if (voucher.type === 'PERCENTAGE' && (!voucher.maxDiscount || voucher.maxDiscount <= 0)) {
      throw new BadRequestError('Voucher configuration invalid: maxDiscount is required');
    }
  }

  static calculatePrice(
    type: DiscountType,
    value: number,
    input: { subtotal: number; maxDiscount: number | null },
  ): VoucherPricingResult {
    let discountAmount = 0;

    if (type === 'PERCENTAGE') {
      discountAmount = (input.subtotal * value) / 100;
      if (input.maxDiscount !== null) {
        discountAmount = Math.min(discountAmount, input.maxDiscount);
      }
    } else {
      discountAmount = value;
    }

    discountAmount = Math.min(discountAmount, input.subtotal);
    discountAmount = Math.max(0, Math.round(discountAmount));

    return {
      subtotal: Math.round(input.subtotal),
      discountAmount,
      finalTotal: Math.max(0, Math.round(input.subtotal - discountAmount)),
    };
  }
}
