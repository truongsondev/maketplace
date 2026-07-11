import { apiClient } from "@/lib/api-client";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api.types";

export interface CreatePayosPaymentLinkRequest {
  amount: number;
  description?: string;
  cartItemIds?: string[];
  voucherCode?: string;
  shipping?: {
    recipient: string;
    phone: string;
    addressLine: string;
    ward: string;
    district?: string;
    city: string;
    addressId?: string | null;
    ghnProvinceId: number;
    ghnDistrictId: number;
    ghnWardCode: string;
  };
}

export interface CreatePayosPaymentLinkResponse {
  orderId: string;
  orderCode: string;
  checkoutUrl: string;
  qrCode: string;
  paymentLinkId: string;
  status: string;
  expiredAt?: number;
}

export interface CreateCodOrderResponse {
  orderId: string;
  paymentMethod: "COD";
  paymentStatus: "PENDING";
  subtotalAmount: number;
  discountAmount: number;
  shippingFee: 0;
  totalAmount: number;
}

export interface PayosReturnVerification {
  orderCode: string;
  amount: number;
  amountPaid: number;
  amountRemaining: number;
  paymentLinkId: string;
  gatewayStatus: string;
  dbStatus?: "PENDING" | "PAID" | "FAILED";
  message: string;
}

export interface PaymentOrderStatus {
  orderId: string;
  orderCode: string;
  amount: number;
  status: "PENDING" | "PAID" | "FAILED";
  bankCode?: string;
  gatewayReference?: string;
  gatewayCode?: string;
  paidAt?: string;
}

export const payosPaymentService = {
  async createCodOrder(
    payload: CreatePayosPaymentLinkRequest,
  ): Promise<CreateCodOrderResponse> {
    const response = await apiClient.post<CreateCodOrderResponse>(
      "api/payments/cod/orders",
      payload,
    );
    if (response.success) {
      return (response as ApiSuccessResponse<CreateCodOrderResponse>).data;
    }
    throw response as ApiErrorResponse;
  },

  async createPaymentLink(
    payload: CreatePayosPaymentLinkRequest,
  ): Promise<CreatePayosPaymentLinkResponse> {
    const response = await apiClient.post<CreatePayosPaymentLinkResponse>(
      "api/payments/payos/create-link",
      payload,
    );

    if (response.success) {
      return (response as ApiSuccessResponse<CreatePayosPaymentLinkResponse>)
        .data;
    }

    throw response as ApiErrorResponse;
  },

  async verifyReturn(orderCode: string): Promise<PayosReturnVerification> {
    const response = await apiClient.get<PayosReturnVerification>(
      `api/payments/payos/return?orderCode=${encodeURIComponent(orderCode)}`,
    );

    if (response.success) {
      return (response as ApiSuccessResponse<PayosReturnVerification>).data;
    }

    throw response as ApiErrorResponse;
  },

  async getPaymentStatus(orderCode: string): Promise<PaymentOrderStatus> {
    const response = await apiClient.get<PaymentOrderStatus>(
      `api/payments/payos/orders/${encodeURIComponent(orderCode)}/status`,
    );

    if (response.success) {
      return (response as ApiSuccessResponse<PaymentOrderStatus>).data;
    }

    throw response as ApiErrorResponse;
  },
};
