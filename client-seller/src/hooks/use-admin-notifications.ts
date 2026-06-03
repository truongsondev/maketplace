import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminNotificationService } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { useAdminNotificationSound } from "@/hooks/use-admin-notification-sound";
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
  type?: "PAYMENT_SUCCESS" | "LOW_STOCK" | "CANCEL_REQUEST" | "NEW_ORDER";
  orderId?: string;
  orderCode?: string | null;
  customerName?: string | null;
  totalAmount?: number;
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
  const {
    soundEnabled,
    needsInteraction,
    enableSound,
    disableSound,
    playNewOrderSound,
  } = useAdminNotificationSound();

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

    const applyRealtimePayload = (payload: NotificationRealtimePayload) => {
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
    };

    const upsertFromSseEvent = (event: Event) => {
      try {
        const payload = JSON.parse(
          (event as MessageEvent<string>).data,
        ) as NotificationRealtimePayload;
        applyRealtimePayload(payload);
        toast.success(payload.content);
      } catch {
        // Ignore malformed SSE payloads and keep stream alive.
      }
    };

    const handleNewOrderEvent = (event: Event) => {
      try {
        const payload = JSON.parse(
          (event as MessageEvent<string>).data,
        ) as NotificationRealtimePayload;
        applyRealtimePayload(payload);

        toast.success(payload.content, {
          description: needsInteraction
            ? "Trình duyệt đang chặn autoplay. Bấm Bật âm thanh để nghe thông báo đơn mới."
            : "Đơn hàng mới vừa được tạo.",
        });
      } catch {
        // Keep stream alive on malformed payload.
      }

      void playNewOrderSound();
    };

    eventSource.addEventListener("payment_success", upsertFromSseEvent);
    eventSource.addEventListener("low_stock", upsertFromSseEvent);
    eventSource.addEventListener("cancel_request", upsertFromSseEvent);
    eventSource.addEventListener("new_order", handleNewOrderEvent);

    return () => {
      eventSource.removeEventListener("payment_success", upsertFromSseEvent);
      eventSource.removeEventListener("low_stock", upsertFromSseEvent);
      eventSource.removeEventListener("cancel_request", upsertFromSseEvent);
      eventSource.removeEventListener("new_order", handleNewOrderEvent);
      eventSource.close();
    };
  }, [
    isAuthenticated,
    accessToken,
    queryClient,
    needsInteraction,
    playNewOrderSound,
  ]);

  const notifications = useMemo(
    () => listQuery.data?.items ?? [],
    [listQuery.data?.items],
  );

  return {
    notifications,
    unreadCount: listQuery.data?.unreadCount ?? 0,
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    soundEnabled,
    soundNeedsInteraction: needsInteraction,
    enableSound,
    disableSound,
    markAsRead: (notificationId: string) =>
      markReadMutation.mutateAsync(notificationId),
    markAllAsRead: () => markAllReadMutation.mutateAsync(),
  };
}
