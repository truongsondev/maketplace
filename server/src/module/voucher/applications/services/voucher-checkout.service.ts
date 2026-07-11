import { BadRequestError } from '../../../../error-handlling/badRequestError';
import type { Prisma } from '@/generated/prisma/client';
import { VoucherRulesService } from './voucher-rules.service';
import type { IDiscountVoucherRepository } from '../ports/output/voucher.repository';
import {
  PromotionPricingService,
  type PromotionAllocation,
} from '../../../promotion/promotion-pricing.service';
import { calculateLoyaltyDiscount } from '../../../user-profile/loyalty-benefits';
import {
  assertBirthdayVoucherCanBeUsed,
  getBirthdayYear,
} from './birthday-voucher-rules.service';

export interface CheckoutVoucherResult {
  subtotalAmount: number;
  promotionDiscountAmount: number;
  discountAmount: number;
  voucherDiscountAmount: number;
  loyaltyDiscountAmount: number;
  loyaltyDiscountPercent: number;
  loyaltyTier: string;
  loyaltyTierLabel: string;
  payableAmount: number;
  appliedVoucherId?: string;
  appliedVoucherCode?: string;
  cartId: string;
  itemIds: string[];
  itemDiscounts: Array<{
    cartItemId: string;
    eligible: boolean;
    discountAmount: number;
    promotionDiscountAmount: number;
    voucherDiscountAmount: number;
    loyaltyDiscountAmount: number;
    promotion: PromotionAllocation | null;
  }>;
}

export class VoucherCheckoutService {
  private readonly promotionPricingService = new PromotionPricingService();

  constructor(private readonly voucherRepository: IDiscountVoucherRepository) {}

  async calculateForCheckout(params: {
    userId: string;
    amount?: number;
    voucherCode?: string;
    cartItemIds?: string[];
    tx?: Prisma.TransactionClient;
  }): Promise<CheckoutVoucherResult> {
    const cartTotals = await this.voucherRepository.getCartTotals(
      params.userId,
      params.cartItemIds,
      params.tx,
    );

    const promotionPricing = params.tx
      ? await this.promotionPricingService.calculateForCart({
          tx: params.tx,
          items: cartTotals.items,
        })
      : { totalDiscount: 0, allocations: [] as PromotionAllocation[] };
    const promotionByItemId = new Map(
      promotionPricing.allocations.map((allocation) => [allocation.cartItemId, allocation]),
    );
    const promotionDiscountAmount = promotionPricing.totalDiscount;
    let voucherDiscountAmount = 0;
    let payableAmount = Math.round(cartTotals.subtotal - promotionDiscountAmount);
    let appliedVoucherId: string | undefined;
    let appliedVoucherCode: string | undefined;
    let itemDiscounts = cartTotals.items.map((item) => {
      const promotion = promotionByItemId.get(item.id) ?? null;
      return {
        cartItemId: item.id,
        eligible: false,
        discountAmount: promotion?.discountAmount ?? 0,
        promotionDiscountAmount: promotion?.discountAmount ?? 0,
        voucherDiscountAmount: 0,
        loyaltyDiscountAmount: 0,
        promotion,
      };
    });

    if (params.voucherCode) {
      const voucher = await this.voucherRepository.findByCode(params.voucherCode, params.tx);
      if (!voucher) {
        throw new BadRequestError('Voucher does not exist');
      }

      if (voucher.isBirthdayVoucher) {
        const year = getBirthdayYear();
        const usageCount = await this.voucherRepository.countUserUsageForYear(
          voucher.id,
          params.userId,
          year,
          params.tx,
        );
        const orderCount = await this.voucherRepository.countUserVoucherOrdersForYear(
          voucher.id,
          params.userId,
          year,
          params.tx,
        );
        assertBirthdayVoucherCanBeUsed({
          birthday: cartTotals.userBirthday,
          usageCountForYear: usageCount + orderCount,
        });
      }

      const voucherBaseItems = cartTotals.items.map((item) => {
        const promotion = promotionByItemId.get(item.id);
        const lineSubtotal = item.unitPrice * item.quantity;
        const promotionDiscount = promotion?.discountAmount ?? 0;
        const unitPriceAfterPromotion = Math.max(
          0,
          Math.floor((lineSubtotal - promotionDiscount) / item.quantity),
        );
        return {
          ...item,
          unitPrice: promotion?.stackableWithVoucher === false ? 0 : unitPriceAfterPromotion,
        };
      });
      const eligibleItems = voucherBaseItems.filter((item) => VoucherRulesService.isItemEligible(voucher, item, cartTotals.memberTier));
      const eligibleSubtotal = eligibleItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      if (eligibleSubtotal <= 0) throw new BadRequestError('Voucher is not eligible for any cart item');
      const minimumBasis = voucher.minAmountBasis === 'CART_SUBTOTAL' ? cartTotals.subtotal : eligibleSubtotal;
      VoucherRulesService.ensureVoucherIsApplicable(voucher, minimumBasis);
      const userUsageCount = await this.voucherRepository.countUserUsage(
        voucher.id,
        params.userId,
        params.tx,
      );

      if (voucher.userUsageLimit !== null && userUsageCount >= voucher.userUsageLimit) {
        throw new BadRequestError('Voucher usage limit per user exceeded');
      }

      const pricing = VoucherRulesService.calculatePrice(voucher.type, voucher.value, {
        subtotal: eligibleSubtotal,
        maxDiscount: voucher.maxDiscount,
      });

      voucherDiscountAmount = pricing.discountAmount;
      payableAmount = Math.round(cartTotals.subtotal - promotionDiscountAmount - pricing.discountAmount);
      let allocated = 0;
      itemDiscounts = cartTotals.items.map((item) => {
        const promotion = promotionByItemId.get(item.id) ?? null;
        const promotionLineDiscount = promotion?.discountAmount ?? 0;
        const eligible = eligibleItems.some((candidate) => candidate.id === item.id);
        if (!eligible) {
          return {
            cartItemId: item.id,
            eligible: false,
            discountAmount: promotionLineDiscount,
            promotionDiscountAmount: promotionLineDiscount,
            voucherDiscountAmount: 0,
            loyaltyDiscountAmount: 0,
            promotion,
          };
        }
        const voucherBaseItem = eligibleItems.find((candidate) => candidate.id === item.id) ?? item;
        const lineSubtotal = voucherBaseItem.unitPrice * item.quantity;
        const isLast = item.id === eligibleItems[eligibleItems.length - 1]?.id;
        const voucherLineDiscount = isLast ? pricing.discountAmount - allocated : Math.floor(pricing.discountAmount * lineSubtotal / eligibleSubtotal);
        allocated += voucherLineDiscount;
        return {
          cartItemId: item.id,
          eligible: true,
          discountAmount: promotionLineDiscount + voucherLineDiscount,
          promotionDiscountAmount: promotionLineDiscount,
          voucherDiscountAmount: voucherLineDiscount,
          loyaltyDiscountAmount: 0,
          promotion,
        };
      });
      appliedVoucherId = voucher.id;
      appliedVoucherCode = voucher.code;
    }

    const loyalty = calculateLoyaltyDiscount({
      tier: cartTotals.memberTier,
      amount: payableAmount,
    });
    let allocatedLoyalty = 0;
    if (loyalty.discountAmount > 0) {
      const discountableItems = itemDiscounts
        .map((item) => {
          const cartItem = cartTotals.items.find((candidate) => candidate.id === item.cartItemId);
          const lineSubtotal = cartItem ? cartItem.unitPrice * cartItem.quantity : 0;
          const lineAfterDiscount = Math.max(0, lineSubtotal - item.discountAmount);
          return { ...item, lineAfterDiscount };
        })
        .filter((item) => item.lineAfterDiscount > 0);
      const discountableSubtotal = discountableItems.reduce(
        (sum, item) => sum + item.lineAfterDiscount,
        0,
      );
      const lastId = discountableItems[discountableItems.length - 1]?.cartItemId;
      itemDiscounts = itemDiscounts.map((item) => {
        const discountable = discountableItems.find(
          (candidate) => candidate.cartItemId === item.cartItemId,
        );
        if (!discountable || discountableSubtotal <= 0) return item;
        const loyaltyLineDiscount =
          item.cartItemId === lastId
            ? loyalty.discountAmount - allocatedLoyalty
            : Math.floor((loyalty.discountAmount * discountable.lineAfterDiscount) / discountableSubtotal);
        allocatedLoyalty += loyaltyLineDiscount;
        return {
          ...item,
          discountAmount: item.discountAmount + loyaltyLineDiscount,
          loyaltyDiscountAmount: loyaltyLineDiscount,
        };
      });
    }
    payableAmount = Math.max(0, payableAmount - loyalty.discountAmount);
    const discountAmount =
      promotionDiscountAmount + voucherDiscountAmount + loyalty.discountAmount;

    if (params.amount !== undefined && payableAmount !== Math.round(params.amount)) {
      throw new BadRequestError('Checkout amount is outdated. Please refresh and try again.');
    }

    return {
      subtotalAmount: Math.round(cartTotals.subtotal),
      promotionDiscountAmount,
      voucherDiscountAmount,
      loyaltyDiscountAmount: loyalty.discountAmount,
      loyaltyDiscountPercent: loyalty.discountPercent,
      loyaltyTier: loyalty.tier,
      loyaltyTierLabel: loyalty.tierLabel,
      discountAmount,
      payableAmount,
      appliedVoucherId,
      appliedVoucherCode,
      cartId: cartTotals.cartId,
      itemIds: cartTotals.items.map((item) => item.id),
      itemDiscounts,
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

    if (!order.discount) {
      throw new BadRequestError('Voucher does not exist');
    }

    const now = new Date();
    if (!order.discount.isActive) {
      throw new BadRequestError('Voucher is inactive');
    }
    if (now < order.discount.startAt || now > order.discount.endAt) {
      throw new BadRequestError('Voucher is not in active time range');
    }

    // Increment first to lock the discount row during this transaction. If the
    // later per-user check fails, the surrounding payment transaction rolls back.
    const incremented = await this.voucherRepository.incrementUsedCountIfAvailable(
      order.discountId,
      tx,
    );
    if (!incremented) {
      throw new BadRequestError('Voucher usage limit exceeded');
    }

    const userUsageCount = await this.voucherRepository.countUserUsage(
      order.discountId,
      order.userId,
      tx,
    );
    if (
      order.discount.userUsageLimit !== null &&
      userUsageCount >= order.discount.userUsageLimit
    ) {
      throw new BadRequestError('Voucher usage limit per user exceeded');
    }

    const usageYear = order.discount?.isBirthdayVoucher ? getBirthdayYear() : null;

    await this.voucherRepository.createDiscountUsage({
      discountId: order.discountId,
      userId: order.userId,
      orderId,
      usageYear,
      tx,
    });
  }

  async recordPromotionUsageForPaidOrder(tx: Prisma.TransactionClient, orderId: string): Promise<void> {
    await this.promotionPricingService.recordUsageForOrder(tx, orderId);
  }
}
