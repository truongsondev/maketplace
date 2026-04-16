import type {
  AdminOrderStatusBreakdown,
  AdminOrderTimeseries,
} from '../../dto/admin-order-analytics.dto';

export type AdminOrderAnalyticsCommand = {
  days: number;
};

export interface IAdminOrderAnalyticsRepository {
  getStatusBreakdown(command: AdminOrderAnalyticsCommand): Promise<AdminOrderStatusBreakdown>;
  getTimeseries(command: AdminOrderAnalyticsCommand): Promise<AdminOrderTimeseries>;
}
