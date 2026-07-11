import express, { type Request, type Response } from 'express';
import type { PrismaClient } from '@/generated/prisma/client';
import { BadRequestError } from '../../../../../error-handlling/badRequestError';
import { ForbiddenError } from '../../../../../error-handlling/forbiddenError';
import { ResponseFormatter } from '../../../../../shared/server/api-response';
import { asyncHandler } from '../../../../../shared/server/error-middleware';
import { LoyaltyMutationService } from '../../../../user-profile/loyalty.service';

export class PhysicalSaleAPI {
  readonly router = express.Router();
  constructor(private readonly prisma: PrismaClient) {
    this.registerRoutes('/physical-sales');
    this.registerRoutes('/products/physical-sales');
  }

  private registerRoutes(prefix: string): void {
    this.router.post(prefix, asyncHandler(this.create.bind(this)));
    this.router.get(prefix, asyncHandler(this.list.bind(this)));
    this.router.get(`${prefix}/catalog`, asyncHandler(this.catalog.bind(this)));
    this.router.get(`${prefix}/:id`, asyncHandler(this.detail.bind(this)));
    this.router.post(`${prefix}/:id/cancel`, asyncHandler(this.cancel.bind(this)));
  }

  private async create(req: Request, res: Response): Promise<void> {
    if (!req.userId) throw new ForbiddenError('Authentication required');
    const body = req.body as Record<string, unknown>;
    const paymentMethod = String(body.paymentMethod || '').toUpperCase();
    if (!['CASH', 'BANK_TRANSFER', 'CARD'].includes(paymentMethod)) {
      throw new BadRequestError('Invalid physical sale payment method');
    }
    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) throw new BadRequestError('At least one sale item is required');
    const actorId = req.userId;
    const idempotencyKey = String(req.header('Idempotency-Key') || body.idempotencyKey || '').trim();
    if (!idempotencyKey || idempotencyKey.length > 120) {
      throw new BadRequestError('Idempotency-Key is required (max 120 characters)');
    }

    const existing = await this.prisma.physicalSale.findUnique({
      where: { idempotencyKey }, include: { items: true },
    });
    if (existing) {
      res.status(200).json(ResponseFormatter.success(existing, 'Physical sale already recorded'));
      return;
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const normalized: Array<{ variantId: string; quantity: number; unitPrice: number; before: number; productName: string; sku: string; variantAttributes: object; imageUrl: string | null; lineTotal: number }> = [];
      for (const value of items) {
        const raw = value as Record<string, unknown>;
        const variantId = String(raw.variantId || '').trim();
        const quantity = Number(raw.quantity);
        if (!variantId || !Number.isInteger(quantity) || quantity < 1) {
          throw new BadRequestError('Invalid physical sale item');
        }
        const variant = await tx.productVariant.findFirst({
          where: { id: variantId, isDeleted: false, status: 'ACTIVE' },
          select: { price: true, sku: true, attributes: true, stockOnHand: true, stockReserved: true, stockAvailable: true, product: { select: { name: true, images: { where: { isPrimary: true }, take: 1, select: { url: true } } } }, images: { where: { isPrimary: true }, take: 1, select: { url: true } } },
        });
        if (!variant || variant.stockOnHand - variant.stockReserved < quantity) {
          throw new BadRequestError(`Insufficient stock for variant ${variantId}`);
        }
        const updated = await tx.productVariant.updateMany({
          where: { id: variantId, stockOnHand: variant.stockOnHand, stockReserved: variant.stockReserved, stockAvailable: variant.stockAvailable },
          data: { stockOnHand: { decrement: quantity }, stockAvailable: { decrement: quantity } },
        });
        if (updated.count !== 1) throw new BadRequestError('Inventory changed, please retry');
        const unitPrice = Number(variant.price);
        normalized.push({ variantId, quantity, unitPrice, before: variant.stockOnHand, productName: variant.product.name, sku: variant.sku, variantAttributes: variant.attributes as object, imageUrl: variant.images[0]?.url ?? variant.product.images[0]?.url ?? null, lineTotal: unitPrice * quantity });
      }
      const totalAmount = normalized.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      const sale = await tx.physicalSale.create({
        data: {
          cashierId: actorId,
          code: `POS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
          idempotencyKey,
          paymentMethod,
          totalAmount,
          customerId: typeof body.customerId === 'string' && body.customerId ? body.customerId : null,
          customerPhone: typeof body.customerPhone === 'string' ? body.customerPhone.trim().slice(0, 20) || null : null,
          note: typeof body.note === 'string' ? body.note.trim().slice(0, 500) : null,
          items: { create: normalized.map(({ before: _before, ...item }) => item) },
        },
      });
      for (const item of normalized) {
        await tx.inventoryLog.create({
          data: {
            variantId: item.variantId, action: 'SALE', quantity: item.quantity,
            beforeQuantity: item.before, afterQuantity: item.before - item.quantity,
            referenceType: 'PHYSICAL_SALE', referenceId: sale.id, actorId,
            reason: 'Sale at the physical store', salesChannel: 'PHYSICAL_STORE',
          },
        });
      }
      await tx.auditLog.create({ data: { actorType: 'ADMIN', actorId, targetType: 'PHYSICAL_SALE', targetId: sale.id, action: 'PHYSICAL_SALE_COMPLETED', newData: { code: sale.code, totalAmount, paymentMethod } } });
      await new LoyaltyMutationService(tx).awardForPhysicalSale(sale.id);
      return tx.physicalSale.findUniqueOrThrow({ where: { id: sale.id }, include: { items: true } });
    });
    res.status(201).json(ResponseFormatter.success(result, 'Physical sale recorded'));
  }

  private async list(_req: Request, res: Response): Promise<void> {
    const rows = await this.prisma.physicalSale.findMany({ orderBy: { createdAt: 'desc' }, take: 100, include: { items: true } });
    res.status(200).json(ResponseFormatter.success(rows));
  }

  private async catalog(req: Request, res: Response): Promise<void> {
    const search = String(req.query.search || '').trim();
    const rows = await this.prisma.productVariant.findMany({
      where: { isDeleted: false, status: 'ACTIVE', product: { isDeleted: false }, ...(search ? { OR: [{ sku: { contains: search } }, { product: { name: { contains: search } } }] } : {}) },
      take: 30,
      select: {
        id: true,
        productId: true,
        sku: true,
        attributes: true,
        price: true,
        stockAvailable: true,
        stockOnHand: true,
        stockReserved: true,
        images: {
          where: { isPrimary: true },
          take: 1,
          select: { url: true },
        },
        product: {
          select: {
            id: true,
            name: true,
            images: {
              where: { isPrimary: true },
              take: 1,
              select: { url: true },
            },
          },
        },
      },
    });
    res.status(200).json(ResponseFormatter.success(rows.map((row) => ({
      ...row,
      imageUrl: row.images[0]?.url ?? row.product.images[0]?.url ?? null,
      product: {
        id: row.product.id,
        name: row.product.name,
        imageUrl: row.product.images[0]?.url ?? row.images[0]?.url ?? null,
      },
      sellableStock: row.stockOnHand - row.stockReserved,
    }))));
  }

  private async detail(req: Request, res: Response): Promise<void> {
    const row = await this.prisma.physicalSale.findUnique({ where: { id: String(req.params.id) }, include: { items: true } });
    if (!row) throw new BadRequestError('Physical sale not found');
    res.status(200).json(ResponseFormatter.success(row));
  }

  private async cancel(req: Request, res: Response): Promise<void> {
    if (!req.userId) throw new ForbiddenError('Authentication required');
    const id = String(req.params.id || '');
    const reason = String((req.body as Record<string, unknown>)?.reason || '').trim();
    if (!reason) throw new BadRequestError('Cancellation reason is required');
    const result = await this.prisma.$transaction(async (tx) => {
      const sale = await tx.physicalSale.findUnique({ where: { id }, include: { items: true } });
      if (!sale) throw new BadRequestError('Physical sale not found');
      if (sale.status === 'CANCELLED') return sale;
      const claimed = await tx.physicalSale.updateMany({ where: { id, status: 'COMPLETED' }, data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledBy: req.userId, cancelReason: reason.slice(0, 500) } });
      if (claimed.count !== 1) throw new BadRequestError('Physical sale status changed, please retry');
      for (const item of sale.items) {
        const before = await tx.productVariant.findUniqueOrThrow({ where: { id: item.variantId }, select: { stockOnHand: true } });
        await tx.productVariant.update({ where: { id: item.variantId }, data: { stockOnHand: { increment: item.quantity }, stockAvailable: { increment: item.quantity } } });
        await tx.inventoryLog.create({ data: { variantId: item.variantId, action: 'RETURN', quantity: item.quantity, beforeQuantity: before.stockOnHand, afterQuantity: before.stockOnHand + item.quantity, referenceType: 'PHYSICAL_SALE_CANCEL', referenceId: sale.id, actorId: req.userId, reason: reason.slice(0, 500), salesChannel: 'PHYSICAL_STORE' } });
      }
      await new LoyaltyMutationService(tx).reverseForReference({
        referenceType: 'PHYSICAL_SALE',
        referenceId: sale.id,
        idempotencyKey: `PHYSICAL_SALE:${sale.id}:CANCEL_REVERSE`,
        description: 'Thu hồi điểm từ giao dịch tại cửa hàng bị hủy/hoàn',
      });
      await tx.auditLog.create({ data: { actorType: 'ADMIN', actorId: req.userId, targetType: 'PHYSICAL_SALE', targetId: sale.id, action: 'PHYSICAL_SALE_CANCELLED', newData: { reason } } });
      return tx.physicalSale.findUniqueOrThrow({ where: { id }, include: { items: true } });
    });
    res.status(200).json(ResponseFormatter.success(result, 'Physical sale cancelled'));
  }
}
