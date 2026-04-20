import type {
  AdminNotificationItem,
  BroadcastAdminPaymentSuccessInput,
  ListAdminNotificationsQuery,
  ListAdminNotificationsResult,
} from '../../dto/admin-notification.dto';

export interface IAdminNotificationsRepository {
  listByAdminUserId(
    userId: string,
    query: ListAdminNotificationsQuery,
  ): Promise<ListAdminNotificationsResult>;
  markAsRead(userId: string, notificationId: string): Promise<boolean>;
  markAllAsRead(userId: string): Promise<number>;
  createForAllAdmins(input: BroadcastAdminPaymentSuccessInput): Promise<AdminNotificationItem[]>;
}
