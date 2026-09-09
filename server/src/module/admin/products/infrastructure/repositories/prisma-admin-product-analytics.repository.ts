import { Prisma, PrismaClient } from '@/generated/prisma/client';
import type {
  AdminProductLeastBought,
  AdminProductLeastBoughtItem,
  AdminProductTopFavorited,
  AdminProductTopFavoritedItem,
  AdminProductTopSelling,
  AdminProductTopSellingItem,
} from '../../applications/dto/admin-product-analytics.dto';
import type {
  AdminProductAnalyticsCommand,
  IAdminProductAnalyticsRepository,
} from '../../applications/ports/output/admin-product-analytics.repository';

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

export class PrismaAdminProductAnalyticsRepository implements IAdminProductAnalyticsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getTopSelling(command: AdminProductAnalyticsCommand): Promise<AdminProductTopSelling> {
    const days = clampDays(command.days);
    const limit = clampLimit(command.limit);
    const { from, to } = buildDateRange(days);

    const rows = await this.prisma.$queryRaw<
      Array<{
        productId: string;
        name: string;
        imageUrl: string | null;
        quantitySold: bigint | number | null;
        ordersCount: bigint | number | null;
      }>
    >(Prisma.sql`
      SELECT
        p.id AS productId,
        p.name AS name,
        pi.imageUrl AS imageUrl,
        SUM(oi.quantity) AS quantitySold,
        COUNT(DISTINCT o.id) AS ordersCount
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN payments pay ON pay.order_id = o.id
      JOIN products p ON p.id = oi.product_id
      LEFT JOIN (
        SELECT
          product_id,
          SUBSTRING_INDEX(
            GROUP_CONCAT(url ORDER BY is_primary DESC, sort_order ASC SEPARATOR ','),
            ',',
            1
          ) AS imageUrl
        FROM product_images
        GROUP BY product_id
      ) pi ON pi.product_id = p.id
      WHERE pay.status IN ('PAID', 'SUCCESS')
        AND pay.paid_at IS NOT NULL
        AND pay.paid_at >= ${from}
        AND pay.paid_at < ${to}
        AND p.is_deleted = 0
        AND p.deleted_at IS NULL
      GROUP BY p.id
      ORDER BY quantitySold DESC
      LIMIT ${limit}
    `);

    const items: AdminProductTopSellingItem[] = rows.map((r) => ({
      productId: r.productId,
      name: r.name,
      imageUrl: r.imageUrl,
      quantitySold: Number(r.quantitySold ?? 0),
      ordersCount: Number(r.ordersCount ?? 0),
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

  async getTopFavorited(command: AdminProductAnalyticsCommand): Promise<AdminProductTopFavorited> {
    const days = clampDays(command.days);
    const limit = clampLimit(command.limit);
    const { from, to } = buildDateRange(days);

    const rows = await this.prisma.$queryRaw<
      Array<{
        productId: string;
        name: string;
        imageUrl: string | null;
        favoritesCount: bigint | number | null;
      }>
    >(Prisma.sql`
      SELECT
        p.id AS productId,
        p.name AS name,
        pi.imageUrl AS imageUrl,
        COUNT(*) AS favoritesCount
      FROM wishlists w
      JOIN products p ON p.id = w.product_id
      LEFT JOIN (
        SELECT
          product_id,
          SUBSTRING_INDEX(
            GROUP_CONCAT(url ORDER BY is_primary DESC, sort_order ASC SEPARATOR ','),
            ',',
            1
          ) AS imageUrl
        FROM product_images
        GROUP BY product_id
      ) pi ON pi.product_id = p.id
      WHERE w.created_at >= ${from}
        AND w.created_at < ${to}
        AND p.is_deleted = 0
        AND p.deleted_at IS NULL
      GROUP BY p.id
      ORDER BY favoritesCount DESC
      LIMIT ${limit}
    `);

    const items: AdminProductTopFavoritedItem[] = rows.map((r) => ({
      productId: r.productId,
      name: r.name,
      imageUrl: r.imageUrl,
      favoritesCount: Number(r.favoritesCount ?? 0),
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

  async getLeastBought(command: AdminProductAnalyticsCommand): Promise<AdminProductLeastBought> {
    const days = clampDays(command.days);
    const limit = clampLimit(command.limit);
    const { from, to } = buildDateRange(days);

    const rows = await this.prisma.$queryRaw<
      Array<{
        productId: string;
        name: string;
        imageUrl: string | null;
        quantitySold: bigint | number | null;
      }>
    >(Prisma.sql`
      SELECT
        p.id AS productId,
        p.name AS name,
        pi.imageUrl AS imageUrl,
        COALESCE(SUM(CASE WHEN pay.order_id IS NULL THEN 0 ELSE oi.quantity END), 0) AS quantitySold
      FROM products p
      LEFT JOIN order_items oi ON oi.product_id = p.id
      LEFT JOIN orders o ON o.id = oi.order_id
      LEFT JOIN payments pay
        ON pay.order_id = o.id
       AND pay.status IN ('PAID', 'SUCCESS')
       AND pay.paid_at IS NOT NULL
       AND pay.paid_at >= ${from}
       AND pay.paid_at < ${to}
      LEFT JOIN (
        SELECT
          product_id,
          SUBSTRING_INDEX(
            GROUP_CONCAT(url ORDER BY is_primary DESC, sort_order ASC SEPARATOR ','),
            ',',
            1
          ) AS imageUrl
        FROM product_images
        GROUP BY product_id
      ) pi ON pi.product_id = p.id
      WHERE p.is_deleted = 0
        AND p.deleted_at IS NULL
      GROUP BY p.id
      ORDER BY quantitySold ASC, p.created_at DESC
      LIMIT ${limit}
    `);

    const items: AdminProductLeastBoughtItem[] = rows.map((r) => ({
      productId: r.productId,
      name: r.name,
      imageUrl: r.imageUrl,
      quantitySold: Number(r.quantitySold ?? 0),
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
