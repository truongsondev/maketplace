import type { AdminUserTopSpenders } from '../dto/admin-user-analytics.dto';
import type {
  AdminUserAnalyticsTopSpendersCommand,
  IAdminUserAnalyticsRepository,
} from '../ports/output/admin-user-analytics.repository';

export class GetAdminUserTopSpendersUseCase {
  constructor(private readonly repo: IAdminUserAnalyticsRepository) {}

  execute(command: AdminUserAnalyticsTopSpendersCommand): Promise<AdminUserTopSpenders> {
    return this.repo.getTopSpenders(command);
  }
}
