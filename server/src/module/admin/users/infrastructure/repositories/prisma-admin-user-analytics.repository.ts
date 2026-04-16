import { Prisma, PrismaClient } from '@/generated/prisma/client';
import type {
  AdminUserCustomerCohorts,
  AdminUserTopSpenderItem,
  AdminUserTopSpenders,
} from '../../applications/dto/admin-user-analytics.dto';
import type {
  AdminUserAnalyticsCohortsCommand,
  AdminUserAnalyticsTopSpendersCommand,
  IAdminUserAnalyticsRepository,
} from '../../applications/ports/output/admin-user-analytics.repository';

function startOfDay(d: Date): Date {
  const next = new Date(d);
  next.setHours(0, 0, 0, 0);
  return next;
}

function buildDateRange(days: number): { from: Date; to: Date } {
  const now = new Date();
  const to = new Date(now);
  to.setDate(to.getDate() + 1);
  to.setHours(0, 0, 0, 0);

  const from = startOfDay(now);
  from.setDate(from.getDate() - (days - 1));

  return { from, to };
}

function clampDays(input: number): number {
  const n = Number(input);
  if (!Number.isFinite(n) || n <= 0) return 30;
  return Math.max(1, Math.min(Math.floor(n), 365));
}

function clampLimit(input: number): number {
  const n = Number(input);
  if (!Number.isFinite(n) || n <= 0) return 10;
  return Math.max(1, Math.min(Math.floor(n), 50));
}

export class PrismaAdminUserAnalyticsRepository implements IAdminUserAnalyticsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getCustomerCohorts(
    command: AdminUserAnalyticsCohortsCommand,
  ): Promise<AdminUserCustomerCohorts> {
    const days = clampDays(command.days);
    const { from, to } = buildDateRange(days);

    // Customers are defined as users with at least one PAID/SUCCESS payment.
    // New customers: first paidAt is within range.
    // Returning customers: had a paid order in range AND first paidAt < from.
    const rows = await this.prisma.$queryRaw<
      Array<{
        customersWithOrders: bigint | number;
        newCustomers: bigint | number;
        returningCustomers: bigint | number;
      }>
    >(Prisma.sql`
      SELECT
        SUM(CASE WHEN t.had_in_range = 1 THEN 1 ELSE 0 END) AS customersWithOrders,
        SUM(CASE WHEN t.first_paid_at >= ${from} AND t.first_paid_at < ${to} THEN 1 ELSE 0 END) AS newCustomers,
        SUM(CASE WHEN t.first_paid_at < ${from} AND t.had_in_range = 1 THEN 1 ELSE 0 END) AS returningCustomers
      FROM (
        SELECT
          o.user_id,
          MIN(p.paid_at) AS first_paid_at,
          MAX(CASE WHEN p.paid_at >= ${from} AND p.paid_at < ${to} THEN 1 ELSE 0 END) AS had_in_range
        FROM orders o
        JOIN payments p ON p.order_id = o.id
        WHERE p.status IN ('PAID', 'SUCCESS')
          AND p.paid_at IS NOT NULL
        GROUP BY o.user_id
      ) t
    `);

    const first = rows[0];
    return {
      from: from.toISOString(),
      to: to.toISOString(),
      days,
      customersWithOrders: Number(first?.customersWithOrders ?? 0),
      newCustomers: Number(first?.newCustomers ?? 0),
      returningCustomers: Number(first?.returningCustomers ?? 0),
      updatedAt: new Date().toISOString(),
    };
  }

  async getTopSpenders(
    command: AdminUserAnalyticsTopSpendersCommand,
  ): Promise<AdminUserTopSpenders> {
    const days = clampDays(command.days);
    const limit = clampLimit(command.limit);
    const { from, to } = buildDateRange(days);

    const rows = await this.prisma.$queryRaw<
      Array<{
        userId: string;
        email: string | null;
        phone: string | null;
        totalSpent: Prisma.Decimal | string | number;
        ordersCount: bigint | number;
        lastPaidAt: Date | string | null;
      }>
    >(Prisma.sql`
      SELECT
        u.id AS userId,
        u.email AS email,
        u.phone AS phone,
        SUM(o.total_price) AS totalSpent,
        COUNT(*) AS ordersCount,
        MAX(p.paid_at) AS lastPaidAt
      FROM orders o
      JOIN payments p ON p.order_id = o.id
      JOIN users u ON u.id = o.user_id
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      WHERE p.status IN ('PAID', 'SUCCESS')
        AND p.paid_at IS NOT NULL
        AND p.paid_at >= ${from}
        AND p.paid_at < ${to}
        AND r.code = 'BUYER'
      GROUP BY u.id
      ORDER BY totalSpent DESC
      LIMIT ${limit}
    `);

    const items: AdminUserTopSpenderItem[] = rows.map((r) => ({
      userId: r.userId,
      email: r.email,
      phone: r.phone,
      totalSpent: Number(r.totalSpent),
      ordersCount: Number(r.ordersCount),
      lastPaidAt: r.lastPaidAt ? new Date(r.lastPaidAt as any).toISOString() : null,
    }));

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      days,
      limit,
      items,
      updatedAt: new Date().toISOString(),
    };
  }
}
