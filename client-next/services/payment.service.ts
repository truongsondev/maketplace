import { apiClient } from "@/lib/api-client";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api.types";

export interface CreateVnpayPaymentRequest {
  amount: number;
  orderInfo: string;
  locale: "vn" | "en";
  orderType: string;
  bankCode?: string;
}

export interface CreateVnpayPaymentResponse {
  orderId: string;
  orderCode: string;
  paymentUrl: string;
  expiredAt: string;
}

export interface VnpayReturnVerification {
  isValidSignature: boolean;
  orderCode?: string;
  amount?: number;
  responseCode?: string;
  transactionStatus?: string;
  bankCode?: string;
  payDate?: string;
  message: string;
}

export interface PaymentOrderStatus {
  orderId: string;
  orderCode: string;
  amount: number;
  status: "PENDING" | "PAID" | "FAILED";
  bankCode?: string;
  vnpTransactionNo?: string;
  vnpResponseCode?: string;
  vnpTransactionStatus?: string;
  paidAt?: string;
}

export const paymentService = {
  async createVnpayPaymentUrl(
    payload: CreateVnpayPaymentRequest,
  ): Promise<CreateVnpayPaymentResponse> {
    const response = await apiClient.post<CreateVnpayPaymentResponse>(
      "api/payments/vnpay/create-url",
      payload,
    );

    if (response.success) {
      return (response as ApiSuccessResponse<CreateVnpayPaymentResponse>).data;
    }

    throw response as ApiErrorResponse;
  },

  async verifyVnpayReturn(
    query: URLSearchParams,
  ): Promise<VnpayReturnVerification> {
    const response = await apiClient.get<VnpayReturnVerification>(
      `api/payments/vnpay/return?${query.toString()}`,
    );

    if (response.success) {
      return (response as ApiSuccessResponse<VnpayReturnVerification>).data;
    }

    throw response as ApiErrorResponse;
  },

  async getPaymentStatus(orderCode: string): Promise<PaymentOrderStatus> {
    const response = await apiClient.get<PaymentOrderStatus>(
      `api/payments/vnpay/orders/${encodeURIComponent(orderCode)}/status`,
    );

    if (response.success) {
      return (response as ApiSuccessResponse<PaymentOrderStatus>).data;
    }

    throw response as ApiErrorResponse;
  },
};
