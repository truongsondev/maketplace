import type {
  AdminDashboardOverview,
  AdminDashboardRecentOrder,
  AdminDashboardTimeseries,
} from '../../dto/admin-dashboard.dto';

export type AdminDashboardTimeseriesCommand = {
  /** how many days back (including today). */
  days?: number;
  from?: Date;
  to?: Date;
};

export type AdminDashboardOverviewCommand = {
  days?: number;
  from?: Date;
  to?: Date;
};

export type ListAdminDashboardRecentOrdersCommand = {
  limit: number;
  from?: Date;
  to?: Date;
};

export interface IAdminDashboardRepository {
  getOverview(command?: AdminDashboardOverviewCommand): Promise<AdminDashboardOverview>;
  getTimeseries(command: AdminDashboardTimeseriesCommand): Promise<AdminDashboardTimeseries>;
  listRecentOrders(
    command: ListAdminDashboardRecentOrdersCommand,
  ): Promise<AdminDashboardRecentOrder[]>;
}
