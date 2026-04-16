import { apiClient } from "@/lib/api-client";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api.types";
import type {
  CancelReasonCode,
  MyOrdersCountsData,
  MyOrdersListData,
  MyOrderListItem,
  OrderSort,
  OrderTab,
} from "@/types/order.types";

function buildQueryString(
  params: Record<string, string | number | boolean | undefined>,
) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const orderService = {
  async getMyOrders(
    params: {
      tab?: OrderTab;
      sort?: OrderSort;
      search?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<MyOrdersListData> {
    const query = buildQueryString({
      tab: params.tab,
      sort: params.sort,
      search: params.search,
      page: params.page,
      limit: params.limit,
    });

    const response = await apiClient.get<MyOrdersListData>(
      `api/orders${query}`,
    );

    if (response.success) {
      return (response as ApiSuccessResponse<MyOrdersListData>).data;
    }

    throw response as ApiErrorResponse;
  },

  async getMyOrderCounts(): Promise<MyOrdersCountsData> {
    const response =
      await apiClient.get<MyOrdersCountsData>("api/orders/counts");

    if (response.success) {
      return (response as ApiSuccessResponse<MyOrdersCountsData>).data;
    }

    throw response as ApiErrorResponse;
  },

  async getMyOrderDetail(orderId: string): Promise<MyOrderListItem> {
    const response = await apiClient.get<MyOrderListItem>(
      `api/orders/${encodeURIComponent(orderId)}`,
    );

    if (response.success) {
      return (response as ApiSuccessResponse<MyOrderListItem>).data;
    }

    throw response as ApiErrorResponse;
  },

  async cancelMyOrder(orderId: string): Promise<void> {
    const response = await apiClient.post<{ id: string; status: string }>(
      `api/orders/${encodeURIComponent(orderId)}/cancel`,
      {},
    );

    if (response.success) {
      return;
    }

    throw response as ApiErrorResponse;
  },

  async requestPaidCancel(params: {
    orderId: string;
    reasonCode: CancelReasonCode;
    reasonText?: string;
    bankAccountName: string;
    bankAccountNumber: string;
    bankName: string;
  }): Promise<void> {
    const response = await apiClient.post<{
      id: string;
      status: string;
      cancelRequestStatus: string;
    }>(`api/orders/${encodeURIComponent(params.orderId)}/cancel-request`, {
      reasonCode: params.reasonCode,
      reasonText: params.reasonText,
      bankAccountName: params.bankAccountName,
      bankAccountNumber: params.bankAccountNumber,
      bankName: params.bankName,
    });

    if (response.success) {
      return;
    }

    throw response as ApiErrorResponse;
  },

  async confirmReceived(orderId: string): Promise<void> {
    const response = await apiClient.post<{ id: string; status: string }>(
      `api/orders/${encodeURIComponent(orderId)}/confirm-received`,
      {},
    );

    if (response.success) {
      return;
    }

    throw response as ApiErrorResponse;
  },

  async requestReturn(orderId: string, reason?: string): Promise<void> {
    const response = await apiClient.post<{ id: string; status: string }>(
      `api/orders/${encodeURIComponent(orderId)}/return`,
      reason ? { reason } : {},
    );

    if (response.success) {
      return;
    }

    throw response as ApiErrorResponse;
  },
};
