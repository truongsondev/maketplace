import express, { Request, Response } from 'express';
import type { Prisma, PrismaClient } from '@/generated/prisma/client';
import type { OrderStatus } from '@/generated/prisma/enums';
import { asyncHandler } from '../../../../shared/server/error-middleware';
import { ResponseFormatter } from '../../../../shared/server/api-response';
import { BadRequestError } from '../../../../error-handlling/badRequestError';

type OrderTab = 'all' | 'pending' | 'processing' | 'shipped' | 'completed' | 'canceled';

type OrderSort = 'new' | 'old';

function parsePositiveInt(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

function mapTabToStatuses(tab: OrderTab | undefined): OrderStatus[] | undefined {
  if (!tab || tab === 'all') return undefined;
  if (tab === 'pending') return ['PENDING'];
  if (tab === 'processing') return ['CONFIRMED', 'PAID'];
  if (tab === 'shipped') return ['SHIPPED'];
  if (tab === 'completed') return ['DELIVERED'];
  if (tab === 'canceled') return ['CANCELLED'];
  return undefined;
}

function pickPrimaryImageUrl(input: {
  variantImages?: Array<{ url: string; isPrimary: boolean; sortOrder: number }>;
  productImages?: Array<{ url: string; isPrimary: boolean; sortOrder: number }>;
}): string | null {
  const images = [...(input.variantImages ?? []), ...(input.productImages ?? [])];
  if (images.length === 0) return null;

  const sorted = images
    .slice()
    .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0) || a.sortOrder - b.sortOrder);

  return sorted[0]?.url ?? null;
}

function safeAttributesToText(attributes: unknown): string {
  if (!attributes || typeof attributes !== 'object') return '';
  const entries = Object.entries(attributes as Record<string, unknown>)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .slice(0, 6);
  return entries.map(([k, v]) => `${k}: ${String(v)}`).join(' • ');
}

export class OrdersAPI {
  readonly router = express.Router();

  constructor(private readonly prisma: PrismaClient) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', asyncHandler(this.listMyOrders.bind(this)));
    this.router.get('/counts', asyncHandler(this.getMyCounts.bind(this)));
    this.router.get('/:orderId', asyncHandler(this.getMyOrderDetail.bind(this)));
    this.router.post('/:orderId/cancel', asyncHandler(this.cancelMyOrder.bind(this)));
  }

  private async listMyOrders(req: Request, res: Response): Promise<void> {
    const userId = req.userId;
    if (!userId) {
      throw new BadRequestError('User ID not found');
    }

    const tab = (req.query.tab as OrderTab | undefined) ?? 'all';
    const search = (req.query.search as string | undefined)?.trim();
    const sort = (req.query.sort as OrderSort | undefined) ?? 'new';

    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, 10), 50);
    const skip = (page - 1) * limit;

    const statuses = mapTabToStatuses(tab);

    const where: Prisma.OrderWhereInput = {
      userId,
      ...(statuses ? { status: { in: statuses } } : {}),
      ...(search
        ? {
            OR: [
              { id: { contains: search } },
              { paymentTransaction: { orderCode: { contains: search } } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.OrderOrderByWithRelationInput =
      sort === 'old' ? { createdAt: 'asc' } : { createdAt: 'desc' };

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          payment: { select: { method: true, status: true, paidAt: true } },
          paymentTransaction: { select: { status: true, orderCode: true, paidAt: true } },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: { select: { url: true, isPrimary: true, sortOrder: true } },
                },
              },
              variant: {
                select: {
                  id: true,
                  attributes: true,
                  images: { select: { url: true, isPrimary: true, sortOrder: true } },
                },
              },
            },
          },
        },
      }),
    ]);

    const items = orders.map((o) => ({
      id: o.id,
      createdAt: o.createdAt,
      status: o.status,
      totalPrice: o.totalPrice,
      orderCode: o.paymentTransaction?.orderCode ?? null,
      payment: {
        method: o.payment?.method ?? null,
        status: o.payment?.status ?? null,
        paidAt: o.payment?.paidAt ?? null,
        transactionStatus: o.paymentTransaction?.status ?? null,
        transactionPaidAt: o.paymentTransaction?.paidAt ?? null,
      },
      items: o.items.map((it) => {
        const imageUrl = pickPrimaryImageUrl({
          variantImages: it.variant?.images,
          productImages: it.product.images,
        });
        return {
          id: it.id,
          productId: it.productId,
          variantId: it.variantId,
          name: it.product.name,
          imageUrl,
          attributesText: safeAttributesToText(it.variant?.attributes),
          quantity: it.quantity,
          price: it.price,
        };
      }),
    }));

    res.status(200).json(
      ResponseFormatter.success(
        {
          items,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
        'Orders fetched successfully',
      ),
    );
  }

  private async getMyCounts(req: Request, res: Response): Promise<void> {
    const userId = req.userId;
    if (!userId) {
      throw new BadRequestError('User ID not found');
    }

    const rows = await this.prisma.order.groupBy({
      by: ['status'],
      where: { userId },
      _count: { _all: true },
    });

    const counts = rows.reduce(
      (acc, r) => {
        acc[r.status] = r._count._all;
        return acc;
      },
      {} as Record<string, number>,
    );

    const pending = counts.PENDING ?? 0;
    const processing = (counts.CONFIRMED ?? 0) + (counts.PAID ?? 0);
    const shipped = counts.SHIPPED ?? 0;
    const completed = counts.DELIVERED ?? 0;
    const canceled = counts.CANCELLED ?? 0;
    const all = Object.values(counts).reduce((sum, n) => sum + n, 0);

    res
      .status(200)
      .json(
        ResponseFormatter.success({ all, pending, processing, shipped, completed, canceled }, 'OK'),
      );
  }

  private async getMyOrderDetail(req: Request, res: Response): Promise<void> {
    const userId = req.userId;
    if (!userId) {
      throw new BadRequestError('User ID not found');
    }

    const rawOrderId = (req.params as any).orderId as string | string[] | undefined;
    const orderId = Array.isArray(rawOrderId) ? rawOrderId[0] : rawOrderId;
    if (!orderId) {
      throw new BadRequestError('orderId is required');
    }

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        payment: { select: { method: true, status: true, paidAt: true } },
        paymentTransaction: { select: { status: true, orderCode: true, paidAt: true } },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: { select: { url: true, isPrimary: true, sortOrder: true } },
              },
            },
            variant: {
              select: {
                id: true,
                attributes: true,
                images: { select: { url: true, isPrimary: true, sortOrder: true } },
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new BadRequestError('Order not found');
    }

    const dto = {
      id: order.id,
      createdAt: order.createdAt,
      status: order.status,
      totalPrice: order.totalPrice,
      orderCode: order.paymentTransaction?.orderCode ?? null,
      payment: {
        method: order.payment?.method ?? null,
        status: order.payment?.status ?? null,
        paidAt: order.payment?.paidAt ?? null,
        transactionStatus: order.paymentTransaction?.status ?? null,
        transactionPaidAt: order.paymentTransaction?.paidAt ?? null,
      },
      items: order.items.map((it) => {
        const imageUrl = pickPrimaryImageUrl({
          variantImages: it.variant?.images,
          productImages: it.product.images,
        });
        return {
          id: it.id,
          productId: it.productId,
          variantId: it.variantId,
          name: it.product.name,
          imageUrl,
          attributesText: safeAttributesToText(it.variant?.attributes),
          quantity: it.quantity,
          price: it.price,
        };
      }),
    };

    res.status(200).json(ResponseFormatter.success(dto, 'OK'));
  }

  private async cancelMyOrder(req: Request, res: Response): Promise<void> {
    const userId = req.userId;
    if (!userId) {
      throw new BadRequestError('User ID not found');
    }

    const rawOrderId = (req.params as any).orderId as string | string[] | undefined;
    const orderId = Array.isArray(rawOrderId) ? rawOrderId[0] : rawOrderId;
    if (!orderId) {
      throw new BadRequestError('orderId is required');
    }

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      select: { id: true, status: true },
    });

    if (!order) {
      throw new BadRequestError('Order not found');
    }

    if (order.status === 'CANCELLED') {
      res.status(200).json(ResponseFormatter.success({ id: order.id, status: order.status }, 'OK'));
      return;
    }

    if (['SHIPPED', 'DELIVERED', 'RETURNED'].includes(order.status)) {
      throw new BadRequestError('Cannot cancel an order that is already shipped/delivered');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
        select: { id: true, status: true },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          oldStatus: order.status,
          newStatus: 'CANCELLED',
          changedBy: userId,
        },
      });

      return updatedOrder;
    });

    res.status(200).json(ResponseFormatter.success(updated, 'Order cancelled'));
  }
}
