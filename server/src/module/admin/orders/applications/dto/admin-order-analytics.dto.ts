import type { OrderStatus } from '@/generated/prisma/enums';

export type AdminOrderStatusBreakdown = {
  from: string;
  to: string;
  days: number;
  total: number;
  counts: Record<OrderStatus, number>;
  updatedAt: string;
};

export type AdminOrderTimeseriesPoint = {
  /** YYYY-MM-DD */
  date: string;
  total: number;
};

export type AdminOrderTimeseries = {
  from: string;
  to: string;
  days: number;
  points: AdminOrderTimeseriesPoint[];
  updatedAt: string;
};
