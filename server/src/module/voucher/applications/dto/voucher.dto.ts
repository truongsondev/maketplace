import type { DiscountType } from '@/generated/prisma/enums';

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
  bannerImageUrl: string | null;
}

export interface VoucherPricingResult {
  subtotal: number;
  discountAmount: number;
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
}

export interface CartTotalsResult {
  cartId: string;
  subtotal: number;
  items: CartItemPricing[];
}
