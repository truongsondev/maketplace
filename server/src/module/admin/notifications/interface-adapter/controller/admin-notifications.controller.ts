import type { ListAdminNotificationsResult } from '../../applications/dto/admin-notification.dto';
import { ListAdminNotificationsUseCase } from '../../applications/use-cases/list-admin-notifications.usecase';
import { MarkAdminNotificationReadUseCase } from '../../applications/use-cases/mark-admin-notification-read.usecase';
import { MarkAllAdminNotificationsReadUseCase } from '../../applications/use-cases/mark-all-admin-notifications-read.usecase';

export class AdminNotificationsController {
  constructor(
    private readonly listUseCase: ListAdminNotificationsUseCase,
    private readonly markReadUseCase: MarkAdminNotificationReadUseCase,
    private readonly markAllReadUseCase: MarkAllAdminNotificationsReadUseCase,
  ) {}

  list(userId: string, page: number, limit: number): Promise<ListAdminNotificationsResult> {
    return this.listUseCase.execute(userId, page, limit);
  }

  markAsRead(userId: string, notificationId: string): Promise<boolean> {
    return this.markReadUseCase.execute(userId, notificationId);
  }

  markAllAsRead(userId: string): Promise<number> {
    return this.markAllReadUseCase.execute(userId);
  }
}
