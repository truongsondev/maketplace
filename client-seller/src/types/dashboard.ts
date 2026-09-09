export type DashboardOverview = {
  range: { from: string; to: string; days: number };
  revenue: { currency: "VND"; total: number };
  orders: { total: number };
  itemsSold: { total: number };
  profit: {
    currency: "VND";
    total: number;
  } | null;
  updatedAt: string;
};

export type DashboardTimeseriesPoint = {
  date: string;
  revenue: number;
  orders: number;
  itemsSold: number;
};

export type DashboardTimeseries = {
  from: string;
  to: string;
  days: number;
  points: DashboardTimeseriesPoint[];
  updatedAt: string;
};

export type DashboardRecentOrder = {
  id: string;
  orderCode: string | null;
  createdAt: string;
  status: string;
  totalPrice: number;
  customerEmail: string | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
};
