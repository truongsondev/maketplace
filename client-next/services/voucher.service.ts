import { apiClient } from "@/lib/api-client";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api.types";

export type VoucherType = "PERCENTAGE" | "FIXED_AMOUNT";

export interface VoucherSummary {
  id: string;
  code: string;
  description: string | null;
  type: VoucherType;
  value: number;
  maxDiscount: number | null;
  minOrderAmount: number | null;
  maxUsage: number | null;
  userUsageLimit: number | null;
  usedCount: number;
  startAt: string;
  endAt: string;
  isActive: boolean;
  bannerImageUrl: string | null;
}

export interface VoucherValidationResult {
  voucher: VoucherSummary;
  pricing: {
    subtotal: number;
    discountAmount: number;
    voucherDiscountAmount?: number;
    promotionDiscountAmount?: number;
    promotionAllocations?: Array<{ cartItemId: string; promotionName: string | null; discountAmount: number; stackableWithVoucher: boolean }>;
    loyaltyDiscountAmount?: number;
    loyaltyDiscountPercent?: number;
    loyaltyTier?: string;
    loyaltyTierLabel?: string;
    finalTotal: number;
  };
}

export interface CheckoutPricingPreview {
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
    promotion: {
      cartItemId: string;
      promotionId: string | null;
      promotionName: string | null;
      discountAmount: number;
      stackableWithVoucher: boolean;
    } | null;
  }>;
}

export const voucherService = {
  async getActiveVouchers(): Promise<VoucherSummary[]> {
    const response = await apiClient.get<{ items: VoucherSummary[] }>(
      "api/common/vouchers/active",
    );

    if (response.success) {
      return (response as ApiSuccessResponse<{ items: VoucherSummary[] }>).data
        .items;
    }

    throw response as ApiErrorResponse;
  },

  async validateVoucher(payload: {
    code: string;
    cartItemIds?: string[];
  }): Promise<VoucherValidationResult> {
    const response = await apiClient.post<VoucherValidationResult>(
      "api/vouchers/validate",
      payload,
    );

    if (response.success) {
      return (response as ApiSuccessResponse<VoucherValidationResult>).data;
    }

    throw response as ApiErrorResponse;
  },

  async previewCheckout(payload: {
    cartItemIds?: string[];
    voucherCode?: string;
  }): Promise<CheckoutPricingPreview> {
    const response = await apiClient.post<CheckoutPricingPreview>(
      "api/vouchers/checkout-preview",
      payload,
    );

    if (response.success) {
      return (response as ApiSuccessResponse<CheckoutPricingPreview>).data;
    }

    throw response as ApiErrorResponse;
  },

  async applyVoucher(payload: {
    code: string;
    cartItemIds?: string[];
  }): Promise<VoucherValidationResult> {
    const response = await apiClient.post<VoucherValidationResult>(
      "api/vouchers/apply",
      payload,
    );

    if (response.success) {
      return (response as ApiSuccessResponse<VoucherValidationResult>).data;
    }

    throw response as ApiErrorResponse;
  },
};
