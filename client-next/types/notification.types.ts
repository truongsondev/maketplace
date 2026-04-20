export interface UserNotificationItem {
  id: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  relatedPath: string | null;
}

export interface UserNotificationsData {
  items: UserNotificationItem[];
  total: number;
  page: number;
  limit: number;
  unreadCount: number;
}
