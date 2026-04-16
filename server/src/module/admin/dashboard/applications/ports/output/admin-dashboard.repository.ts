import type {
  AdminDashboardOverview,
  AdminDashboardRecentOrder,
  AdminDashboardTimeseries,
} from '../../dto/admin-dashboard.dto';

export type AdminDashboardTimeseriesCommand = {
  /** how many days back (including today). */
  days: number;
};

export type ListAdminDashboardRecentOrdersCommand = {
  limit: number;
};

export interface IAdminDashboardRepository {
  getOverview(): Promise<AdminDashboardOverview>;
  getTimeseries(command: AdminDashboardTimeseriesCommand): Promise<AdminDashboardTimeseries>;
  listRecentOrders(
    command: ListAdminDashboardRecentOrdersCommand,
  ): Promise<AdminDashboardRecentOrder[]>;
}
