import { Prisma, PrismaClient } from '@/generated/prisma/client';
import type {
  AdminDashboardOverview,
  AdminDashboardRecentOrder,
  AdminDashboardTimeseries,
  AdminDashboardTimeseriesPoint,
} from '../../applications/dto/admin-dashboard.dto';
import type {
  AdminDashboardTimeseriesCommand,
  IAdminDashboardRepository,
  ListAdminDashboardRecentOrdersCommand,
} from '../../applications/ports/output/admin-dashboard.repository';

const PAID_STATUSES = ['PAID', 'SUCCESS'] as const;
const REVENUE_ORDER_STATUS = 'DELIVERED' as const;

function startOfDay(d: Date): Date {
  const next = new Date(d);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfMonth(d: Date): Date {
  const next = new Date(d);
  next.setDate(1);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfYear(d: Date): Date {
  const next = new Date(d);
  next.setMonth(0, 1);
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

export class PrismaAdminDashboardRepository implements IAdminDashboardRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getOverview(): Promise<AdminDashboardOverview> {
    const now = new Date();
    const todayStart = startOfDay(now);
    const monthStart = startOfMonth(now);
    const yearStart = startOfYear(now);

    const [today, month, year] = await Promise.all([
      this.getPaidAggregates(todayStart, now),
      this.getPaidAggregates(monthStart, now),
      this.getPaidAggregates(yearStart, now),
    ]);

    return {
      revenue: {
        currency: 'VND',
        today: today.revenue,
        month: month.revenue,
        year: year.revenue,
      },
      orders: {
        today: today.orders,
        month: month.orders,
        year: year.orders,
      },
      itemsSold: {
        today: today.itemsSold,
        month: month.itemsSold,
        year: year.itemsSold,
      },
      profit: null,
      updatedAt: now.toISOString(),
    };
  }

  async getTimeseries(command: AdminDashboardTimeseriesCommand): Promise<AdminDashboardTimeseries> {
    const days = Math.max(1, Math.min(Math.floor(command.days || 30), 90));
    const { from, to, labels } = buildDateRange(days);

    const revenueRows = await this.prisma.$queryRaw<
      Array<{
        date: Date | string;
        revenue: Prisma.Decimal | number | null;
        orders: bigint | number | null;
      }>
    >(Prisma.sql`
      SELECT DATE(p.paid_at) AS date,
             COALESCE(SUM(p.amount), 0) AS revenue,
             COUNT(*) AS orders
      FROM payments p
      INNER JOIN orders o ON o.id = p.order_id
      WHERE p.status IN (${Prisma.join(PAID_STATUSES)})
        AND o.status = ${REVENUE_ORDER_STATUS}
        AND p.paid_at IS NOT NULL
        AND p.paid_at >= ${from}
        AND p.paid_at < ${to}
      GROUP BY DATE(p.paid_at)
      ORDER BY DATE(p.paid_at) ASC
    `);

    const soldRows = await this.prisma.$queryRaw<
      Array<{ date: Date | string; itemsSold: bigint | number | null }>
    >(Prisma.sql`
      SELECT DATE(p.paid_at) AS date,
             COALESCE(SUM(oi.quantity), 0) AS itemsSold
      FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id
      INNER JOIN payments p ON p.order_id = o.id
      WHERE p.status IN (${Prisma.join(PAID_STATUSES)})
        AND o.status = ${REVENUE_ORDER_STATUS}
        AND p.paid_at IS NOT NULL
        AND p.paid_at >= ${from}
        AND p.paid_at < ${to}
      GROUP BY DATE(p.paid_at)
      ORDER BY DATE(p.paid_at) ASC
    `);

    const revenueMap = new Map<string, { revenue: number; orders: number }>();
    for (const r of revenueRows) {
      const key = typeof r.date === 'string' ? r.date : formatDateOnly(new Date(r.date));
      revenueMap.set(key, {
        revenue: Number(r.revenue ?? 0),
        orders: Number(r.orders ?? 0),
      });
    }

    const soldMap = new Map<string, number>();
    for (const r of soldRows) {
      const key = typeof r.date === 'string' ? r.date : formatDateOnly(new Date(r.date));
      soldMap.set(key, Number(r.itemsSold ?? 0));
    }

    const points: AdminDashboardTimeseriesPoint[] = labels.map((date) => {
      const rev = revenueMap.get(date);
      return {
        date,
        revenue: rev?.revenue ?? 0,
        orders: rev?.orders ?? 0,
        itemsSold: soldMap.get(date) ?? 0,
      };
    });

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      days,
      points,
      updatedAt: new Date().toISOString(),
    };
  }

  async listRecentOrders(
    command: ListAdminDashboardRecentOrdersCommand,
  ): Promise<AdminDashboardRecentOrder[]> {
    const take = Math.max(1, Math.min(Math.floor(command.limit || 5), 20));

    const orders = await this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        createdAt: true,
        status: true,
        totalPrice: true,
        user: { select: { email: true } },
        payment: { select: { method: true, status: true } },
        paymentTransaction: { select: { orderCode: true } },
      },
    });

    return orders.map((o) => ({
      id: o.id,
      orderCode: o.paymentTransaction?.orderCode ?? null,
      createdAt: o.createdAt.toISOString(),
      status: o.status,
      totalPrice: Number(o.totalPrice),
      customerEmail: o.user?.email ?? null,
      paymentMethod: o.payment?.method ?? null,
      paymentStatus: o.payment?.status ?? null,
    }));
  }

  private async getPaidAggregates(
    from: Date,
    to: Date,
  ): Promise<{ revenue: number; orders: number; itemsSold: number }> {
    const [paymentAgg, itemAgg] = await Promise.all([
      this.prisma.payment.aggregate({
        where: {
          status: { in: [...PAID_STATUSES] },
          paidAt: { gte: from, lt: to },
          order: {
            status: REVENUE_ORDER_STATUS,
          },
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.orderItem.aggregate({
        where: {
          order: {
            status: REVENUE_ORDER_STATUS,
            payment: {
              status: { in: [...PAID_STATUSES] },
              paidAt: { gte: from, lt: to },
            },
          },
        },
        _sum: { quantity: true },
      }),
    ]);

    return {
      revenue: Number(paymentAgg._sum.amount ?? 0),
      orders: Number(paymentAgg._count._all ?? 0),
      itemsSold: Number(itemAgg._sum.quantity ?? 0),
    };
  }
}
