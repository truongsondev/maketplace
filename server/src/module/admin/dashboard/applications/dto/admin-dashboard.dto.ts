export type AdminDashboardMoney = {
  currency: 'VND';
  today: number;
  month: number;
  year: number;
};

export type AdminDashboardCount = {
  today: number;
  month: number;
  year: number;
};

export type AdminDashboardOverview = {
  revenue: AdminDashboardMoney;
  orders: AdminDashboardCount;
  itemsSold: AdminDashboardCount;
  /**
   * Profit is optional because current schema does not store cost.
   * When cost is not available, the API returns null.
   */
  profit: AdminDashboardMoney | null;
  updatedAt: string;
};

export type AdminDashboardTimeseriesPoint = {
  /** YYYY-MM-DD */
  date: string;
  revenue: number;
  orders: number;
  itemsSold: number;
};

export type AdminDashboardTimeseries = {
  from: string;
  to: string;
  days: number;
  points: AdminDashboardTimeseriesPoint[];
  updatedAt: string;
};

export type AdminDashboardRecentOrder = {
  id: string;
  orderCode: string | null;
  createdAt: string;
  status: string;
  totalPrice: number;
  customerEmail: string | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
};
