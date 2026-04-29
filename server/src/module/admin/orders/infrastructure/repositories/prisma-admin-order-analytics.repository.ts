import { Prisma, PrismaClient } from '@/generated/prisma/client';
import type { OrderStatus } from '@/generated/prisma/enums';
import type {
  AdminOrderStatusBreakdown,
  AdminOrderTimeseries,
  AdminOrderTimeseriesPoint,
} from '../../applications/dto/admin-order-analytics.dto';
import type {
  AdminOrderAnalyticsCommand,
  IAdminOrderAnalyticsRepository,
} from '../../applications/ports/output/admin-order-analytics.repository';

function startOfDay(d: Date): Date {
  const next = new Date(d);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatDateOnly(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildDateRange(days: number): { from: Date; to: Date; labels: string[] } {
  const now = new Date();
  const endExclusive = new Date(now);
  endExclusive.setDate(endExclusive.getDate() + 1);
  endExclusive.setHours(0, 0, 0, 0);

  const from = startOfDay(now);
  from.setDate(from.getDate() - (days - 1));

  const labels: string[] = [];
  const cursor = new Date(from);
  while (cursor < endExclusive) {
    labels.push(formatDateOnly(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return { from, to: endExclusive, labels };
}

function buildDateRangeFromDates(from: Date, to: Date): { from: Date; to: Date; labels: string[] } {
  const start = startOfDay(from);
  const endExclusive = new Date(to);
  const labels: string[] = [];
  const cursor = new Date(start);
  while (cursor < endExclusive) {
    labels.push(formatDateOnly(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return { from: start, to: endExclusive, labels };
}

function clampDays(input: number): number {
  const n = Number(input);
  if (!Number.isFinite(n) || n <= 0) return 30;
  return Math.max(1, Math.min(Math.floor(n), 365));
}

function resolveRange(command: AdminOrderAnalyticsCommand): {
  from: Date;
  to: Date;
  labels: string[];
  days: number;
} {
  if (command.from && command.to) {
    const { from, to, labels } = buildDateRangeFromDates(command.from, command.to);
    return { from, to, labels, days: labels.length };
  }

  const days = clampDays(command.days ?? 30);
  const { from, to, labels } = buildDateRange(days);
  return { from, to, labels, days };
}

const ALL_ORDER_STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PAID',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
];

export class PrismaAdminOrderAnalyticsRepository implements IAdminOrderAnalyticsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getStatusBreakdown(
    command: AdminOrderAnalyticsCommand,
  ): Promise<AdminOrderStatusBreakdown> {
    const { from, to, days } = resolveRange(command);

    const rows = await this.prisma.order.groupBy({
      by: ['status'],
      where: { createdAt: { gte: from, lt: to } },
      _count: { _all: true },
    });

    const counts = ALL_ORDER_STATUSES.reduce(
      (acc, status) => {
        acc[status] = 0;
        return acc;
      },
      {} as Record<OrderStatus, number>,
    );

    for (const r of rows) {
      counts[r.status] = r._count._all;
    }

    const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      days,
      total,
      counts,
      updatedAt: new Date().toISOString(),
    };
  }

  async getTimeseries(command: AdminOrderAnalyticsCommand): Promise<AdminOrderTimeseries> {
    const { from, to, labels, days } = resolveRange(command);

    const rows = await this.prisma.$queryRaw<
      Array<{ date: Date | string; total: bigint | number | null }>
    >(Prisma.sql`
      SELECT DATE(created_at) AS date,
             COUNT(*) AS total
      FROM orders
      WHERE created_at >= ${from}
        AND created_at < ${to}
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `);

    const map = new Map<string, number>();
    for (const r of rows) {
      const key = typeof r.date === 'string' ? r.date : formatDateOnly(new Date(r.date));
      map.set(key, Number(r.total ?? 0));
    }

    const points: AdminOrderTimeseriesPoint[] = labels.map((date) => ({
      date,
      total: map.get(date) ?? 0,
    }));

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      days,
      points,
      updatedAt: new Date().toISOString(),
    };
  }
}
