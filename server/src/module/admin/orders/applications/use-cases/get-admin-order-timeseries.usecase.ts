import type { AdminOrderTimeseries } from '../dto/admin-order-analytics.dto';
import type {
  AdminOrderAnalyticsCommand,
  IAdminOrderAnalyticsRepository,
} from '../ports/output/admin-order-analytics.repository';

export class GetAdminOrderTimeseriesUseCase {
  constructor(private readonly repo: IAdminOrderAnalyticsRepository) {}

  execute(command: AdminOrderAnalyticsCommand): Promise<AdminOrderTimeseries> {
    return this.repo.getTimeseries(command);
  }
}
