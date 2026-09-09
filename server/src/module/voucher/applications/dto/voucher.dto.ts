import type { DiscountType, VoucherMinAmountBasis, VoucherScopeType } from '@/generated/prisma/enums';

export interface VoucherSummary {
  id: string;
  code: string;
  description: string | null;
  type: DiscountType;
  value: number;
  maxDiscount: number | null;
  minOrderAmount: number | null;
  maxUsage: number | null;
  userUsageLimit: number | null;
  usedCount: number;
  startAt: Date;
  endAt: Date;
  isActive: boolean;
  isBirthdayVoucher?: boolean;
  bannerImageUrl: string | null;
  scopeType?: VoucherScopeType;
  includeDescendants?: boolean;
  minAmountBasis?: VoucherMinAmountBasis;
  includedCategoryIds?: string[];
  excludedCategoryIds?: string[];
  includedProductIds?: string[];
  excludedProductIds?: string[];
  memberTiers?: string[];
}

export interface VoucherPricingResult {
  subtotal: number;
  discountAmount: number;
  voucherDiscountAmount?: number;
  promotionDiscountAmount?: number;
  promotionAllocations?: Array<{
    cartItemId: string;
    promotionName: string | null;
    discountAmount: number;
    stackableWithVoucher: boolean;
  }>;
  loyaltyDiscountAmount?: number;
  loyaltyDiscountPercent?: number;
  loyaltyTier?: string;
  loyaltyTierLabel?: string;
  finalTotal: number;
}

export interface VoucherValidationResult {
  voucher: VoucherSummary;
  pricing: VoucherPricingResult;
}

export interface ValidateVoucherCommand {
  userId: string;
  code: string;
  cartItemIds?: string[];
}

export interface CartItemPricing {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  categoryIds: string[];
  ancestorCategoryIds: string[];
}

export interface CartTotalsResult {
  cartId: string;
  subtotal: number;
  items: CartItemPricing[];
  memberTier: string;
  userBirthday?: Date | null;
}
