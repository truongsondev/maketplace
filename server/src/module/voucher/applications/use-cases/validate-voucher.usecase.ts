import { BadRequestError } from '../../../../error-handlling/badRequestError';
import type { ValidateVoucherCommand, VoucherValidationResult } from '../dto/voucher.dto';
import type { IValidateVoucherUseCase } from '../ports/input/voucher.usecase';
import type { IDiscountVoucherRepository } from '../ports/output/voucher.repository';
import { VoucherRulesService } from '../services/voucher-rules.service';
import { calculateLoyaltyDiscount } from '../../../user-profile/loyalty-benefits';
import { prisma } from '../../../../infrastructure/database';
import { PromotionPricingService } from '../../../promotion/promotion-pricing.service';
import {
  assertBirthdayVoucherCanBeUsed,
  getBirthdayYear,
} from '../services/birthday-voucher-rules.service';

export class ValidateVoucherUseCase implements IValidateVoucherUseCase {
  constructor(private readonly voucherRepository: IDiscountVoucherRepository) {}

  async execute(command: ValidateVoucherCommand): Promise<VoucherValidationResult> {
    const code = command.code.trim();
    if (!code) {
      throw new BadRequestError('Mã voucher là bắt buộc');
    }

    const cartTotals = await this.voucherRepository.getCartTotals(
      command.userId,
      command.cartItemIds,
    );
    const voucher = await this.voucherRepository.findByCode(code);

    if (!voucher) {
      throw new BadRequestError('Voucher không áp dụng được cho đơn hàng này');
    }

    if (voucher.isBirthdayVoucher) {
      const year = getBirthdayYear();
      const usageCount = await this.voucherRepository.countUserUsageForYear(
        voucher.id,
        command.userId,
        year,
      );
      const orderCount = await this.voucherRepository.countUserVoucherOrdersForYear(
        voucher.id,
        command.userId,
        year,
      );
      assertBirthdayVoucherCanBeUsed({
        birthday: cartTotals.userBirthday,
        usageCountForYear: usageCount + orderCount,
      });
    }

    const promotionPricing = await prisma.$transaction((tx) =>
      new PromotionPricingService().calculateForCart({ tx, items: cartTotals.items }),
    );
    const promotionByItemId = new Map(promotionPricing.allocations.map((item) => [item.cartItemId, item]));
    const eligibleItems = cartTotals.items.filter((item) => VoucherRulesService.isItemEligible(voucher, item, cartTotals.memberTier));
    const eligibleSubtotal = eligibleItems.reduce((sum, item) => {
      const promotion = promotionByItemId.get(item.id);
      if (promotion?.stackableWithVoucher === false) return sum;
      return sum + Math.max(0, item.unitPrice * item.quantity - (promotion?.discountAmount ?? 0));
    }, 0);
    if (eligibleSubtotal <= 0) throw new BadRequestError('Voucher không áp dụng cho sản phẩm nào trong giỏ');
    VoucherRulesService.ensureVoucherIsApplicable(voucher, voucher.minAmountBasis === 'CART_SUBTOTAL' ? cartTotals.subtotal : eligibleSubtotal);

    const userUsageCount = await this.voucherRepository.countUserUsage(voucher.id, command.userId);
    if (voucher.userUsageLimit !== null && userUsageCount >= voucher.userUsageLimit) {
      throw new BadRequestError('Voucher đã đạt giới hạn sử dụng cho người dùng này');
    }

    const eligiblePricing = VoucherRulesService.calculatePrice(voucher.type, voucher.value, {
      subtotal: eligibleSubtotal,
      maxDiscount: voucher.maxDiscount,
    });
    const subtotal = Math.round(cartTotals.subtotal);
    const afterPromotion = Math.max(0, subtotal - promotionPricing.totalDiscount);
    const afterVoucher = Math.max(0, afterPromotion - eligiblePricing.discountAmount);
    const loyalty = calculateLoyaltyDiscount({
      tier: cartTotals.memberTier,
      amount: afterVoucher,
    });
    return {
      voucher,
      pricing: {
        subtotal,
        promotionDiscountAmount: promotionPricing.totalDiscount,
        promotionAllocations: promotionPricing.allocations.map((item) => ({
          cartItemId: item.cartItemId,
          promotionName: item.promotionName,
          discountAmount: item.discountAmount,
          stackableWithVoucher: item.stackableWithVoucher,
        })),
        voucherDiscountAmount: eligiblePricing.discountAmount,
        loyaltyDiscountAmount: loyalty.discountAmount,
        loyaltyDiscountPercent: loyalty.discountPercent,
        loyaltyTier: loyalty.tier,
        loyaltyTierLabel: loyalty.tierLabel,
        discountAmount: promotionPricing.totalDiscount + eligiblePricing.discountAmount + loyalty.discountAmount,
        finalTotal: Math.max(0, afterVoucher - loyalty.discountAmount),
      },
    };
  }
}
