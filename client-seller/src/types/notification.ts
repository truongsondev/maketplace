export interface AdminNotificationItem {
  id: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface AdminNotificationListResult {
  items: AdminNotificationItem[];
  total: number;
  page: number;
  limit: number;
  unreadCount: number;
}
