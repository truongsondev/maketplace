import type { IAdminNotificationsRepository } from '../ports/output/admin-notifications.repository';

export class MarkAllAdminNotificationsReadUseCase {
  constructor(private readonly repository: IAdminNotificationsRepository) {}

  async execute(userId: string): Promise<number> {
    return this.repository.markAllAsRead(userId);
  }
}
