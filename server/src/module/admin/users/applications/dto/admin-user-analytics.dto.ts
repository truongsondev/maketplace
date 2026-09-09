export type AdminUserCustomerCohorts = {
  from: string;
  to: string;
  days: number;
  customersWithOrders: number;
  newCustomers: number;
  returningCustomers: number;
  updatedAt: string;
};

export type AdminUserTopSpenderItem = {
  userId: string;
  email: string | null;
  phone: string | null;
  totalSpent: number;
  ordersCount: number;
  lastPaidAt: string | null;
};

export type AdminUserTopSpenders = {
  from: string;
  to: string;
  days: number;
  limit: number;
  items: AdminUserTopSpenderItem[];
  updatedAt: string;
};
