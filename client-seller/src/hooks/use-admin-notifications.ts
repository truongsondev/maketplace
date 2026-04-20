import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminNotificationService } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import type {
  AdminNotificationItem,
  AdminNotificationListResult,
} from "@/types/notification";

const ADMIN_NOTIFICATIONS_QUERY_KEY = ["admin-notifications"];

interface NotificationRealtimePayload {
  id: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

function buildNextCache(
  prev: AdminNotificationListResult | undefined,
  incoming: AdminNotificationItem,
): AdminNotificationListResult {
  if (!prev) {
    return {
      items: [incoming],
      total: 1,
      page: 1,
      limit: 20,
      unreadCount: incoming.isRead ? 0 : 1,
    };
  }

  const alreadyExists = prev.items.some((item) => item.id === incoming.id);
  if (alreadyExists) {
    return prev;
  }

  return {
    ...prev,
    items: [incoming, ...prev.items].slice(0, prev.limit),
    total: prev.total + 1,
    unreadCount: incoming.isRead ? prev.unreadCount : prev.unreadCount + 1,
  };
}

export function useAdminNotifications() {
  const queryClient = useQueryClient();
  const { isAuthenticated, accessToken } = useAuthStore();

  const listQuery = useQuery({
    queryKey: ADMIN_NOTIFICATIONS_QUERY_KEY,
    queryFn: () => adminNotificationService.list({ page: 1, limit: 20 }),
    enabled: isAuthenticated,
    staleTime: 1000 * 15,
  });

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      adminNotificationService.markAsRead(notificationId),
    onSuccess: (_result, notificationId) => {
      queryClient.setQueryData(
        ADMIN_NOTIFICATIONS_QUERY_KEY,
        (prev: AdminNotificationListResult | undefined) => {
          if (!prev) return prev;
          let changed = false;
          const items = prev.items.map((item) => {
            if (item.id !== notificationId || item.isRead) return item;
            changed = true;
            return { ...item, isRead: true };
          });

          if (!changed) return prev;
          return {
            ...prev,
            items,
            unreadCount: Math.max(0, prev.unreadCount - 1),
          };
        },
      );
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => adminNotificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.setQueryData(
        ADMIN_NOTIFICATIONS_QUERY_KEY,
        (prev: AdminNotificationListResult | undefined) => {
          if (!prev) return prev;
          return {
            ...prev,
            items: prev.items.map((item) => ({ ...item, isRead: true })),
            unreadCount: 0,
          };
        },
      );
    },
  });

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    const baseUrl = (
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
    ).replace(/\/+$/, "");
    const streamUrl = `${baseUrl}/api/admin/notifications/stream?token=${encodeURIComponent(accessToken)}`;

    const eventSource = new EventSource(streamUrl);

    const upsertFromSseEvent = (event: Event) => {
      try {
        const payload = JSON.parse(
          (event as MessageEvent<string>).data,
        ) as NotificationRealtimePayload;
        queryClient.setQueryData(
          ADMIN_NOTIFICATIONS_QUERY_KEY,
          (prev: AdminNotificationListResult | undefined) =>
            buildNextCache(prev, {
              id: payload.id,
              content: payload.content,
              isRead: payload.isRead,
              createdAt: payload.createdAt,
            }),
        );
        toast.success(payload.content);
      } catch (_error) {
        // Ignore malformed SSE payloads and keep stream alive.
      }
    };

    eventSource.addEventListener("payment_success", upsertFromSseEvent);
    eventSource.addEventListener("low_stock", upsertFromSseEvent);

    return () => {
      eventSource.removeEventListener("payment_success", upsertFromSseEvent);
      eventSource.removeEventListener("low_stock", upsertFromSseEvent);
      eventSource.close();
    };
  }, [isAuthenticated, accessToken, queryClient]);

  const notifications = useMemo(
    () => listQuery.data?.items ?? [],
    [listQuery.data?.items],
  );

  return {
    notifications,
    unreadCount: listQuery.data?.unreadCount ?? 0,
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    markAsRead: (notificationId: string) =>
      markReadMutation.mutateAsync(notificationId),
    markAllAsRead: () => markAllReadMutation.mutateAsync(),
  };
}
