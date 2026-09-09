import type {
  AdminOrderStatusBreakdown,
  AdminOrderTimeseries,
} from '../../applications/dto/admin-order-analytics.dto';
import type { AdminOrderAnalyticsCommand } from '../../applications/ports/output/admin-order-analytics.repository';
import { GetAdminOrderStatusBreakdownUseCase } from '../../applications/use-cases/get-admin-order-status-breakdown.usecase';
import { GetAdminOrderTimeseriesUseCase } from '../../applications/use-cases/get-admin-order-timeseries.usecase';

export class AdminOrderAnalyticsController {
  constructor(
    private readonly statusBreakdownUseCase: GetAdminOrderStatusBreakdownUseCase,
    private readonly timeseriesUseCase: GetAdminOrderTimeseriesUseCase,
  ) {}

  getStatusBreakdown(command: AdminOrderAnalyticsCommand): Promise<AdminOrderStatusBreakdown> {
    return this.statusBreakdownUseCase.execute(command);
  }

  getTimeseries(command: AdminOrderAnalyticsCommand): Promise<AdminOrderTimeseries> {
    return this.timeseriesUseCase.execute(command);
  }
}
