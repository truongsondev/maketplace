import type { AdminUserCustomerCohorts } from '../dto/admin-user-analytics.dto';
import type {
  AdminUserAnalyticsCohortsCommand,
  IAdminUserAnalyticsRepository,
} from '../ports/output/admin-user-analytics.repository';

export class GetAdminUserCustomerCohortsUseCase {
  constructor(private readonly repo: IAdminUserAnalyticsRepository) {}

  execute(command: AdminUserAnalyticsCohortsCommand): Promise<AdminUserCustomerCohorts> {
    return this.repo.getCustomerCohorts(command);
  }
}
