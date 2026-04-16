import type { AdminDashboardOverview } from '../dto/admin-dashboard.dto';
import type { IAdminDashboardRepository } from '../ports/output/admin-dashboard.repository';

export class GetAdminDashboardOverviewUseCase {
  constructor(private readonly repo: IAdminDashboardRepository) {}

  async execute(): Promise<AdminDashboardOverview> {
    return this.repo.getOverview();
  }
}
