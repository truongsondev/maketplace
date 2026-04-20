import type { ListAdminNotificationsResult } from '../dto/admin-notification.dto';
import type { IAdminNotificationsRepository } from '../ports/output/admin-notifications.repository';

export class ListAdminNotificationsUseCase {
  constructor(private readonly repository: IAdminNotificationsRepository) {}

  async execute(
    userId: string,
    page: number,
    limit: number,
  ): Promise<ListAdminNotificationsResult> {
    return this.repository.listByAdminUserId(userId, { page, limit });
  }
}
