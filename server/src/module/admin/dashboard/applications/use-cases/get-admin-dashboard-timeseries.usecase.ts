import type { AdminDashboardTimeseries } from '../dto/admin-dashboard.dto';
import type {
  AdminDashboardTimeseriesCommand,
  IAdminDashboardRepository,
} from '../ports/output/admin-dashboard.repository';

export class GetAdminDashboardTimeseriesUseCase {
  constructor(private readonly repo: IAdminDashboardRepository) {}

  async execute(command: AdminDashboardTimeseriesCommand): Promise<AdminDashboardTimeseries> {
    return this.repo.getTimeseries(command);
  }
}
