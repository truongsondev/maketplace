export type DashboardOverview = {
  revenue: { currency: "VND"; today: number; month: number; year: number };
  orders: { today: number; month: number; year: number };
  itemsSold: { today: number; month: number; year: number };
  profit: {
    currency: "VND";
    today: number;
    month: number;
    year: number;
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
