export interface AdminNotificationItem {
  id: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
}

export interface ListAdminNotificationsQuery {
  page: number;
  limit: number;
}

export interface ListAdminNotificationsResult {
  items: AdminNotificationItem[];
  total: number;
  page: number;
  limit: number;
  unreadCount: number;
}

export interface BroadcastAdminPaymentSuccessInput {
  orderId: string;
  orderCode: string;
  amount: number;
  paidAt: Date;
}
