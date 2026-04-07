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
    finalTotal: number;
  };
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
};
