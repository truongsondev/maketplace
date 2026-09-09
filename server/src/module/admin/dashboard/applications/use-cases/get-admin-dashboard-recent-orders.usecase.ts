import type { AdminDashboardRecentOrder } from '../dto/admin-dashboard.dto';
import type {
  IAdminDashboardRepository,
  ListAdminDashboardRecentOrdersCommand,
} from '../ports/output/admin-dashboard.repository';

export class GetAdminDashboardRecentOrdersUseCase {
  constructor(private readonly repo: IAdminDashboardRepository) {}

  async execute(
    command: ListAdminDashboardRecentOrdersCommand,
  ): Promise<AdminDashboardRecentOrder[]> {
    return this.repo.listRecentOrders(command);
  }
}
