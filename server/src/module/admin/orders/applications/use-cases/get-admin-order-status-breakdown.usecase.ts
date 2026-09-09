import type { AdminOrderStatusBreakdown } from '../dto/admin-order-analytics.dto';
import type {
  AdminOrderAnalyticsCommand,
  IAdminOrderAnalyticsRepository,
} from '../ports/output/admin-order-analytics.repository';

export class GetAdminOrderStatusBreakdownUseCase {
  constructor(private readonly repo: IAdminOrderAnalyticsRepository) {}

  execute(command: AdminOrderAnalyticsCommand): Promise<AdminOrderStatusBreakdown> {
    return this.repo.getStatusBreakdown(command);
  }
}
