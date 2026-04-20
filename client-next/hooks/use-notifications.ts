import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/notification.service";

export const USER_NOTIFICATIONS_QUERY_KEY = ["user-notifications"] as const;

export function useMyNotifications(
  params: { page?: number; limit?: number } = {},
  enabled = true,
) {
  return useQuery({
    queryKey: [...USER_NOTIFICATIONS_QUERY_KEY, params],
    queryFn: () => notificationService.getMyNotifications(params),
    enabled,
    staleTime: 1000 * 15,
    refetchInterval: enabled ? 1000 * 30 : false,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationService.markAsRead(notificationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: USER_NOTIFICATIONS_QUERY_KEY,
      });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: USER_NOTIFICATIONS_QUERY_KEY,
      });
    },
  });
}
