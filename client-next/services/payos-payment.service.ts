import { apiClient } from "@/lib/api-client";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api.types";

export interface CreatePayosPaymentLinkRequest {
  amount: number;
  description?: string;
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
