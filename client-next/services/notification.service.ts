import { apiClient } from "@/lib/api-client";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api.types";
import type { UserNotificationsData } from "@/types/notification.types";

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

export const notificationService = {
  async getMyNotifications(params?: {
    page?: number;
    limit?: number;
  }): Promise<UserNotificationsData> {
    const query = buildQueryString({
      page: params?.page,
      limit: params?.limit,
    });

    const response = await apiClient.get<UserNotificationsData>(
      `api/orders/notifications${query}`,
    );

    if (response.success) {
      return (response as ApiSuccessResponse<UserNotificationsData>).data;
    }

    throw response as ApiErrorResponse;
  },

  async markAsRead(notificationId: string): Promise<boolean> {
    const response = await apiClient.patch<{ updated: boolean }>(
      `api/orders/notifications/${encodeURIComponent(notificationId)}/read`,
      {},
    );

    if (response.success) {
      return (
        (response as ApiSuccessResponse<{ updated: boolean }>).data.updated ??
        false
      );
    }

    throw response as ApiErrorResponse;
  },

  async markAllAsRead(): Promise<number> {
    const response = await apiClient.patch<{ updatedCount: number }>(
      "api/orders/notifications/read-all",
      {},
    );

    if (response.success) {
      return (
        (response as ApiSuccessResponse<{ updatedCount: number }>).data
          .updatedCount ?? 0
      );
    }

    throw response as ApiErrorResponse;
  },
};
