import express, { type Request, type Response } from 'express';
import { Prisma, type PrismaClient } from '@/generated/prisma/client';
import { BadRequestError } from '../../../../../error-handlling/badRequestError';
import { ForbiddenError } from '../../../../../error-handlling/forbiddenError';
import { ResponseFormatter } from '../../../../../shared/server/api-response';
import { asyncHandler } from '../../../../../shared/server/error-middleware';
import { LoyaltyMutationService } from '../../../../user-profile/loyalty.service';

type Tx = Prisma.TransactionClient;
type SaleInput = {
  paymentMethod: string;
  customerName: string;
  customerPhone: string;
  customerId: string | null;
  note: string | null;
  items: unknown[];
};
type NormalizedItem = {
  variantId: string;
  quantity: number;
  unitPrice: number;
  before: number;
  productName: string;
  sku: string;
  variantAttributes: object;
  imageUrl: string | null;
  lineTotal: number;
};

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
    this.router.put(`${prefix}/:id`, asyncHandler(this.update.bind(this)));
    this.router.delete(`${prefix}/:id`, asyncHandler(this.remove.bind(this)));
    this.router.post(`${prefix}/:id/cancel`, asyncHandler(this.cancel.bind(this)));
  }

  private async parseInput(body: Record<string, unknown>, tx: Tx): Promise<SaleInput> {
    const paymentMethod = String(body.paymentMethod || '').toUpperCase();
    if (!['CASH', 'BANK_TRANSFER', 'CARD'].includes(paymentMethod)) {
      throw new BadRequestError('Phương thức thanh toán không hợp lệ');
    }
    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) throw new BadRequestError('Đơn phải có ít nhất một sản phẩm');

    const customerName = String(body.customerName || '').trim();
    const customerPhone = String(body.customerPhone || '').trim();
    if (!customerName) throw new BadRequestError('Họ tên khách hàng là bắt buộc');
    if (!customerPhone) throw new BadRequestError('Số điện thoại khách hàng là bắt buộc');
    if (customerName.length > 255 || customerPhone.length > 20) {
      throw new BadRequestError('Thông tin khách hàng vượt quá độ dài cho phép');
    }

    const customer = await tx.user.findUnique({
      where: { phone: customerPhone },
      select: { id: true },
    });

    return {
      paymentMethod,
      customerName,
      customerPhone,
      customerId: customer?.id ?? null,
      note: typeof body.note === 'string' ? body.note.trim().slice(0, 500) || null : null,
      items,
    };
  }

  private async takeStock(tx: Tx, items: unknown[]): Promise<NormalizedItem[]> {
    const quantities = new Map<string, number>();
    for (const value of items) {
      const raw = value as Record<string, unknown>;
      const variantId = String(raw.variantId || '').trim();
      const quantity = Number(raw.quantity);
      if (!variantId || !Number.isInteger(quantity) || quantity < 1) {
        throw new BadRequestError('Sản phẩm hoặc số lượng không hợp lệ');
      }
      quantities.set(variantId, (quantities.get(variantId) ?? 0) + quantity);
    }

    const normalized: NormalizedItem[] = [];
    for (const [variantId, quantity] of quantities) {
      const variant = await tx.productVariant.findFirst({
        where: {
          id: variantId,
          isDeleted: false,
          status: 'ACTIVE',
          product: { isDeleted: false, status: 'ACTIVE' },
        },
        select: {
          price: true, sku: true, attributes: true,
          stockOnHand: true, stockReserved: true, stockAvailable: true,
          product: { select: { name: true, images: { where: { isPrimary: true }, take: 1, select: { url: true } } } },
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
        },
      });
      if (!variant) throw new BadRequestError(`Sản phẩm không còn khả dụng: ${variantId}`);

      const sellableStock = variant.stockOnHand - variant.stockReserved;
      if (variant.stockAvailable !== sellableStock) {
        throw new BadRequestError(`Dữ liệu tồn kho không nhất quán cho SKU ${variant.sku}`);
      }
      if (sellableStock < quantity) {
        throw new BadRequestError(`Không đủ tồn kho cho SKU ${variant.sku}`);
      }

      const updated = await tx.productVariant.updateMany({
        where: {
          id: variantId,
          stockOnHand: variant.stockOnHand,
          stockReserved: variant.stockReserved,
          stockAvailable: variant.stockAvailable,
        },
        data: {
          stockOnHand: { decrement: quantity },
          stockAvailable: { decrement: quantity },
        },
      });
      if (updated.count !== 1) {
        throw new BadRequestError(`Tồn kho vừa thay đổi cho SKU ${variant.sku}, vui lòng thử lại`);
      }

      const unitPrice = Number(variant.price);
      normalized.push({
        variantId, quantity, unitPrice, before: variant.stockOnHand,
        productName: variant.product.name, sku: variant.sku,
        variantAttributes: variant.attributes as object,
        imageUrl: variant.images[0]?.url ?? variant.product.images[0]?.url ?? null,
        lineTotal: unitPrice * quantity,
      });
    }
    return normalized;
  }

  private async restoreStock(
    tx: Tx,
    items: Array<{ variantId: string; quantity: number; sku?: string }>,
    referenceType: string,
    referenceId: string,
    actorId: string,
    reason: string,
  ): Promise<void> {
    for (const item of items) {
      const current = await tx.productVariant.findUniqueOrThrow({
        where: { id: item.variantId },
        select: { stockOnHand: true, stockReserved: true, stockAvailable: true, sku: true },
      });
      if (current.stockAvailable !== current.stockOnHand - current.stockReserved) {
        throw new BadRequestError(`Dữ liệu tồn kho không nhất quán cho SKU ${current.sku}`);
      }
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: {
          stockOnHand: { increment: item.quantity },
          stockAvailable: { increment: item.quantity },
        },
      });
      await tx.inventoryLog.create({
        data: {
          variantId: item.variantId, action: 'RETURN', quantity: item.quantity,
          beforeQuantity: current.stockOnHand,
          afterQuantity: current.stockOnHand + item.quantity,
          referenceType, referenceId, actorId,
          reason: reason.slice(0, 500), salesChannel: 'PHYSICAL_STORE',
        },
      });
    }
  }

  private async writeSaleLogs(tx: Tx, saleId: string, actorId: string, items: NormalizedItem[], reason: string): Promise<void> {
    for (const item of items) {
      await tx.inventoryLog.create({
        data: {
          variantId: item.variantId, action: 'SALE', quantity: item.quantity,
          beforeQuantity: item.before, afterQuantity: item.before - item.quantity,
          referenceType: 'PHYSICAL_SALE', referenceId: saleId, actorId,
          reason, salesChannel: 'PHYSICAL_STORE',
        },
      });
    }
  }

  private async create(req: Request, res: Response): Promise<void> {
    if (!req.userId) throw new ForbiddenError('Authentication required');
    const body = req.body as Record<string, unknown>;
    const idempotencyKey = String(req.header('Idempotency-Key') || body.idempotencyKey || '').trim();
    if (!idempotencyKey || idempotencyKey.length > 120) {
      throw new BadRequestError('Idempotency-Key is required (max 120 characters)');
    }
    const existing = await this.prisma.physicalSale.findUnique({ where: { idempotencyKey }, include: { items: true } });
    if (existing) {
      res.status(200).json(ResponseFormatter.success(existing, 'Physical sale already recorded'));
      return;
    }

    const actorId = req.userId;
    const result = await this.prisma.$transaction(async (tx) => {
      const input = await this.parseInput(body, tx);
      const items = await this.takeStock(tx, input.items);
      const totalAmount = items.reduce((sum, item) => sum + item.lineTotal, 0);
      const sale = await tx.physicalSale.create({
        data: {
          cashierId: actorId,
          code: `POS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
          idempotencyKey, paymentMethod: input.paymentMethod, totalAmount,
          customerId: input.customerId, customerName: input.customerName,
          customerPhone: input.customerPhone, note: input.note,
          items: { create: items.map(({ before: _before, ...item }) => item) },
        },
      });
      await this.writeSaleLogs(tx, sale.id, actorId, items, 'Sale at the physical store');
      await tx.auditLog.create({ data: { actorType: 'ADMIN', actorId, targetType: 'PHYSICAL_SALE', targetId: sale.id, action: 'PHYSICAL_SALE_COMPLETED', newData: { code: sale.code, totalAmount, paymentMethod: input.paymentMethod, customerPhone: input.customerPhone } } });
      await new LoyaltyMutationService(tx).awardForPhysicalSale(sale.id);
      return tx.physicalSale.findUniqueOrThrow({ where: { id: sale.id }, include: { items: true } });
    });
    res.status(201).json(ResponseFormatter.success(result, 'Physical sale recorded'));
  }

  private async update(req: Request, res: Response): Promise<void> {
    if (!req.userId) throw new ForbiddenError('Authentication required');
    const id = String(req.params.id || '');
    const body = req.body as Record<string, unknown>;
    const actorId = req.userId;
    const result = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.physicalSale.findUnique({ where: { id }, include: { items: true } });
      if (!existing) throw new BadRequestError('Không tìm thấy đơn vật lý');
      if (existing.status !== 'COMPLETED') throw new BadRequestError('Không thể sửa đơn đã hủy');

      const input = await this.parseInput(body, tx);
      if (existing.customerId && input.customerId !== existing.customerId) {
        throw new BadRequestError(
          'Không thể đổi đơn sang tài khoản thành viên khác vì sẽ làm sai lịch sử điểm',
        );
      }
      await this.restoreStock(tx, existing.items, 'PHYSICAL_SALE_EDIT_RESTORE', id, actorId, 'Restore inventory before editing physical sale');
      const items = await this.takeStock(tx, input.items);
      const totalAmount = items.reduce((sum, item) => sum + item.lineTotal, 0);
      await tx.physicalSaleItem.deleteMany({ where: { saleId: id } });
      await tx.physicalSale.update({
        where: { id },
        data: {
          paymentMethod: input.paymentMethod, totalAmount,
          customerId: input.customerId, customerName: input.customerName,
          customerPhone: input.customerPhone, note: input.note,
          items: { create: items.map(({ before: _before, ...item }) => item) },
        },
      });
      await this.writeSaleLogs(tx, id, actorId, items, 'Apply inventory after editing physical sale');

      const loyalty = new LoyaltyMutationService(tx);
      await loyalty.reverseForReference({
        referenceType: 'PHYSICAL_SALE', referenceId: id,
        idempotencyKey: `PHYSICAL_SALE:${id}:EDIT_REVERSE:${Date.now()}`,
        description: 'Thu hồi điểm trước khi sửa giao dịch tại cửa hàng',
      });
      await loyalty.awardForPhysicalSale(id, `PHYSICAL_SALE:${id}:EDIT_EARN:${Date.now()}`);
      await tx.auditLog.create({ data: { actorType: 'ADMIN', actorId, targetType: 'PHYSICAL_SALE', targetId: id, action: 'PHYSICAL_SALE_UPDATED', oldData: { totalAmount: existing.totalAmount, customerPhone: existing.customerPhone }, newData: { totalAmount, customerPhone: input.customerPhone, paymentMethod: input.paymentMethod } } });
      return tx.physicalSale.findUniqueOrThrow({ where: { id }, include: { items: true } });
    });
    res.status(200).json(ResponseFormatter.success(result, 'Physical sale updated'));
  }

  private async list(req: Request, res: Response): Promise<void> {
    const search = String(req.query.search || '').trim();
    const rows = await this.prisma.physicalSale.findMany({
      where: search ? {
        OR: [
          { code: { contains: search } },
          { customerName: { contains: search } },
          { customerPhone: { contains: search } },
          { items: { some: { OR: [{ productName: { contains: search } }, { sku: { contains: search } }] } } },
        ],
      } : undefined,
      orderBy: { createdAt: 'desc' }, take: 100, include: { items: true },
    });
    res.status(200).json(ResponseFormatter.success(rows));
  }

  private async catalog(req: Request, res: Response): Promise<void> {
    const search = String(req.query.search || '').trim();
    const rows = await this.prisma.productVariant.findMany({
      where: {
        isDeleted: false, status: 'ACTIVE',
        product: { isDeleted: false, status: 'ACTIVE' },
        ...(search ? { OR: [{ sku: { contains: search } }, { product: { name: { contains: search } } }] } : {}),
      },
      take: 50,
      select: {
        id: true, productId: true, sku: true, attributes: true, price: true,
        stockAvailable: true, stockOnHand: true, stockReserved: true,
        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
        product: { select: { id: true, name: true, images: { where: { isPrimary: true }, take: 1, select: { url: true } } } },
      },
    });
    res.status(200).json(ResponseFormatter.success(rows.map((row) => ({
      ...row,
      imageUrl: row.images[0]?.url ?? row.product.images[0]?.url ?? null,
      product: { id: row.product.id, name: row.product.name, imageUrl: row.product.images[0]?.url ?? row.images[0]?.url ?? null },
      sellableStock: row.stockOnHand - row.stockReserved,
      inventoryConsistent: row.stockAvailable === row.stockOnHand - row.stockReserved,
    }))));
  }

  private async detail(req: Request, res: Response): Promise<void> {
    const row = await this.prisma.physicalSale.findUnique({ where: { id: String(req.params.id) }, include: { items: true } });
    if (!row) throw new BadRequestError('Physical sale not found');
    res.status(200).json(ResponseFormatter.success(row));
  }

  private async remove(req: Request, res: Response): Promise<void> {
    (req.body as Record<string, unknown>) = { ...(req.body as Record<string, unknown>), reason: String((req.body as Record<string, unknown>)?.reason || 'Xóa đơn vật lý') };
    await this.cancel(req, res);
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
      await this.restoreStock(tx, sale.items, 'PHYSICAL_SALE_CANCEL', sale.id, req.userId!, reason);
      await new LoyaltyMutationService(tx).reverseForReference({ referenceType: 'PHYSICAL_SALE', referenceId: sale.id, idempotencyKey: `PHYSICAL_SALE:${sale.id}:CANCEL_REVERSE`, description: 'Thu hồi điểm từ giao dịch tại cửa hàng bị hủy/hoàn' });
      await tx.auditLog.create({ data: { actorType: 'ADMIN', actorId: req.userId, targetType: 'PHYSICAL_SALE', targetId: sale.id, action: 'PHYSICAL_SALE_CANCELLED', newData: { reason } } });
      return tx.physicalSale.findUniqueOrThrow({ where: { id }, include: { items: true } });
    });
    res.status(200).json(ResponseFormatter.success(result, 'Physical sale cancelled'));
  }
}
