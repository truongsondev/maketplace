import type {
  AdminDashboardOverview,
  AdminDashboardRecentOrder,
  AdminDashboardTimeseries,
} from '../../applications/dto/admin-dashboard.dto';
import type {
  AdminDashboardTimeseriesCommand,
  AdminDashboardOverviewCommand,
  ListAdminDashboardRecentOrdersCommand,
} from '../../applications/ports/output/admin-dashboard.repository';
import { GetAdminDashboardOverviewUseCase } from '../../applications/use-cases/get-admin-dashboard-overview.usecase';
import { GetAdminDashboardTimeseriesUseCase } from '../../applications/use-cases/get-admin-dashboard-timeseries.usecase';
import { GetAdminDashboardRecentOrdersUseCase } from '../../applications/use-cases/get-admin-dashboard-recent-orders.usecase';

export class AdminDashboardController {
  constructor(
    private readonly getOverviewUseCase: GetAdminDashboardOverviewUseCase,
    private readonly getTimeseriesUseCase: GetAdminDashboardTimeseriesUseCase,
    private readonly getRecentOrdersUseCase: GetAdminDashboardRecentOrdersUseCase,
  ) {}

  getOverview(command?: AdminDashboardOverviewCommand): Promise<AdminDashboardOverview> {
    return this.getOverviewUseCase.execute(command);
  }

  getTimeseries(command: AdminDashboardTimeseriesCommand): Promise<AdminDashboardTimeseries> {
    return this.getTimeseriesUseCase.execute(command);
  }

  listRecentOrders(
    command: ListAdminDashboardRecentOrdersCommand,
  ): Promise<AdminDashboardRecentOrder[]> {
    return this.getRecentOrdersUseCase.execute(command);
  }
}
