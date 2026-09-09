import type {
  AdminUserCustomerCohorts,
  AdminUserTopSpenders,
} from '../../applications/dto/admin-user-analytics.dto';
import type {
  AdminUserAnalyticsCohortsCommand,
  AdminUserAnalyticsTopSpendersCommand,
} from '../../applications/ports/output/admin-user-analytics.repository';
import { GetAdminUserCustomerCohortsUseCase } from '../../applications/use-cases/get-admin-user-customer-cohorts.usecase';
import { GetAdminUserTopSpendersUseCase } from '../../applications/use-cases/get-admin-user-top-spenders.usecase';

export class AdminUserAnalyticsController {
  constructor(
    private readonly cohortsUseCase: GetAdminUserCustomerCohortsUseCase,
    private readonly topSpendersUseCase: GetAdminUserTopSpendersUseCase,
  ) {}

  getCustomerCohorts(command: AdminUserAnalyticsCohortsCommand): Promise<AdminUserCustomerCohorts> {
    return this.cohortsUseCase.execute(command);
  }

  getTopSpenders(command: AdminUserAnalyticsTopSpendersCommand): Promise<AdminUserTopSpenders> {
    return this.topSpendersUseCase.execute(command);
  }
}
