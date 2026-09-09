import type { AdminDashboardOverview } from '../dto/admin-dashboard.dto';
import type {
  AdminDashboardOverviewCommand,
  IAdminDashboardRepository,
} from '../ports/output/admin-dashboard.repository';

export class GetAdminDashboardOverviewUseCase {
  constructor(private readonly repo: IAdminDashboardRepository) {}

  async execute(command?: AdminDashboardOverviewCommand): Promise<AdminDashboardOverview> {
    return this.repo.getOverview(command);
  }
}
