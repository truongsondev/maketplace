import type { IAdminNotificationsRepository } from '../ports/output/admin-notifications.repository';

export class MarkAdminNotificationReadUseCase {
  constructor(private readonly repository: IAdminNotificationsRepository) {}

  async execute(userId: string, notificationId: string): Promise<boolean> {
    return this.repository.markAsRead(userId, notificationId);
  }
}
