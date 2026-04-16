import type {
  AdminUserCustomerCohorts,
  AdminUserTopSpenders,
} from '../../dto/admin-user-analytics.dto';

export type AdminUserAnalyticsCohortsCommand = {
  days: number;
};

export type AdminUserAnalyticsTopSpendersCommand = {
  days: number;
  limit: number;
};

export interface IAdminUserAnalyticsRepository {
  getCustomerCohorts(command: AdminUserAnalyticsCohortsCommand): Promise<AdminUserCustomerCohorts>;
  getTopSpenders(command: AdminUserAnalyticsTopSpendersCommand): Promise<AdminUserTopSpenders>;
}
