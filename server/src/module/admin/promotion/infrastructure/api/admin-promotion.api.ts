import express, { type Request, type Response } from 'express';
import type { Prisma, PrismaClient } from '@/generated/prisma/client';
import { BadRequestError } from '../../../../../error-handlling/badRequestError';
import { ForbiddenError } from '../../../../../error-handlling/forbiddenError';
import { ResponseFormatter } from '../../../../../shared/server/api-response';
import { asyncHandler } from '../../../../../shared/server/error-middleware';
import { PromotionPricingService } from '../../../../promotion/promotion-pricing.service';

const PROMOTION_TYPES = ['PERCENTAGE', 'FIXED_AMOUNT', 'SALE_PRICE', 'COMBO_FIXED', 'BUY_X_GET_Y'];
const PROMOTION_STATUSES = ['DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'ENDED'];
const PROMOTION_SCOPES = ['ALL_PRODUCTS', 'INCLUDE_CATEGORIES', 'INCLUDE_PRODUCTS', 'MEMBER_TIERS'];
const CAMPAIGN_TYPES = ['FLASH_SALE', 'HOLIDAY', 'CUSTOMER_APPRECIATION', 'SEASONAL', 'CUSTOM'];

function slugify(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.map((item) => String(item).trim()).filter(Boolean))]
    : [];
}

function normalizePromotionInput(body: Record<string, unknown>) {
  const name = String(body.name || '').trim();
  const type = String(body.type || '').toUpperCase();
  const status = String(body.status || 'DRAFT').toUpperCase();
  const campaignType = String(body.campaignType || 'CUSTOM').toUpperCase();
  const scopeType = String(body.scopeType || 'ALL_PRODUCTS').toUpperCase();
  const value = Number(body.value);
  const priority = Number(body.priority ?? 0);
  const usageLimit = body.usageLimit === null || body.usageLimit === undefined || body.usageLimit === ''
    ? null
    : Number(body.usageLimit);
  const maxDiscount = body.maxDiscount === null || body.maxDiscount === undefined || body.maxDiscount === ''
    ? null
    : Number(body.maxDiscount);
  const startAt = new Date(String(body.startAt || ''));
  const endAt = new Date(String(body.endAt || ''));

  if (!name || name.length > 255) throw new BadRequestError('Promotion name is required');
  if (!PROMOTION_TYPES.includes(type)) throw new BadRequestError('Invalid promotion type');
  if (!PROMOTION_STATUSES.includes(status)) throw new BadRequestError('Invalid promotion status');
  if (!CAMPAIGN_TYPES.includes(campaignType)) throw new BadRequestError('Invalid campaign type');
  if (!PROMOTION_SCOPES.includes(scopeType)) throw new BadRequestError('Invalid promotion scope');
  if (!Number.isFinite(value) || value <= 0) throw new BadRequestError('Invalid promotion value');
  if (!Number.isInteger(priority)) throw new BadRequestError('Invalid promotion priority');
  if (usageLimit !== null && (!Number.isInteger(usageLimit) || usageLimit < 1)) {
    throw new BadRequestError('Invalid usage limit');
  }
  if (maxDiscount !== null && (!Number.isFinite(maxDiscount) || maxDiscount <= 0)) {
    throw new BadRequestError('Invalid max discount');
  }
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || startAt >= endAt) {
    throw new BadRequestError('Invalid promotion time range');
  }

  return {
    data: {
      name,
      slug: slugify(String(body.slug || name)) || `promotion-${Date.now()}`,
      title: String(body.title || name).trim().slice(0, 255),
      subtitle: typeof body.subtitle === 'string' ? body.subtitle.trim().slice(0, 255) || null : null,
      description: typeof body.description === 'string' ? body.description.trim() || null : null,
      bannerImageUrl: typeof body.bannerImageUrl === 'string' ? body.bannerImageUrl.trim().slice(0, 1000) || null : null,
      mobileBannerImageUrl: typeof body.mobileBannerImageUrl === 'string' ? body.mobileBannerImageUrl.trim().slice(0, 1000) || null : null,
      campaignType: campaignType as any,
      type: type as any,
      status: status as any,
      scopeType: scopeType as any,
      includeDescendants: Boolean(body.includeDescendants),
      value,
      maxDiscount,
      priority,
      displayPriority: Number.isInteger(Number(body.displayPriority)) ? Number(body.displayPriority) : 0,
      isFeatured: Boolean(body.isFeatured),
      ctaLabel: typeof body.ctaLabel === 'string' ? body.ctaLabel.trim().slice(0, 100) || null : null,
      ctaUrl: typeof body.ctaUrl === 'string' ? body.ctaUrl.trim().slice(0, 1000) || null : null,
      memberTiers: asStringArray(body.memberTiers),
      usageLimit,
      stackableWithVoucher: body.stackableWithVoucher !== false,
      startAt,
      endAt,
    },
    includedProductIds: asStringArray(body.includedProductIds),
    includedCategoryIds: asStringArray(body.includedCategoryIds),
  };
}

export class AdminPromotionAPI {
  readonly router = express.Router();

  constructor(private readonly prisma: PrismaClient) {
    this.router.get('/', asyncHandler(this.list.bind(this)));
    this.router.post('/preview/cart', asyncHandler(this.previewCart.bind(this)));
    this.router.get('/:id', asyncHandler(this.detail.bind(this)));
    this.router.post('/', asyncHandler(this.create.bind(this)));
    this.router.put('/:id', asyncHandler(this.update.bind(this)));
    this.router.patch('/:id/status', asyncHandler(this.setStatus.bind(this)));
  }

  private include() {
    return {
      includedProducts: true,
      includedCategories: true,
      _count: { select: { usages: true } },
    } satisfies Prisma.PromotionInclude;
  }

  private async list(req: Request, res: Response): Promise<void> {
    const search = String(req.query.search || '').trim();
    const items = await this.prisma.promotion.findMany({
      where: search ? { name: { contains: search } } : undefined,
      include: this.include(),
      orderBy: [{ createdAt: 'desc' }],
      take: 100,
    });
    res.status(200).json(ResponseFormatter.success({ items }));
  }

  private async detail(req: Request, res: Response): Promise<void> {
    const item = await this.prisma.promotion.findUnique({
      where: { id: String(req.params.id) },
      include: this.include(),
    });
    if (!item) throw new BadRequestError('Promotion not found');
    res.status(200).json(ResponseFormatter.success(item));
  }

  private async create(req: Request, res: Response): Promise<void> {
    if (!req.userId) throw new ForbiddenError('Authentication required');
    const input = normalizePromotionInput(req.body as Record<string, unknown>);
    const item = await this.prisma.$transaction(async (tx) => {
      const created = await tx.promotion.create({
        data: {
          ...input.data,
          includedProducts: { create: input.includedProductIds.map((productId) => ({ productId })) },
          includedCategories: { create: input.includedCategoryIds.map((categoryId) => ({ categoryId })) },
        },
        include: this.include(),
      });
      await tx.auditLog.create({
        data: {
          actorType: 'ADMIN',
          actorId: req.userId,
          targetType: 'PROMOTION',
          targetId: created.id,
          action: 'PROMOTION_CREATED',
          newData: { name: created.name, type: created.type, status: created.status },
        },
      });
      return created;
    });
    res.status(201).json(ResponseFormatter.success(item, 'Promotion created'));
  }

  private async update(req: Request, res: Response): Promise<void> {
    if (!req.userId) throw new ForbiddenError('Authentication required');
    const id = String(req.params.id || '');
    const input = normalizePromotionInput(req.body as Record<string, unknown>);
    const item = await this.prisma.$transaction(async (tx) => {
      const current = await tx.promotion.findUnique({ where: { id } });
      if (!current) throw new BadRequestError('Promotion not found');
      await tx.promotionIncludedProduct.deleteMany({ where: { promotionId: id } });
      await tx.promotionIncludedCategory.deleteMany({ where: { promotionId: id } });
      const updated = await tx.promotion.update({
        where: { id },
        data: {
          ...input.data,
          includedProducts: { create: input.includedProductIds.map((productId) => ({ productId })) },
          includedCategories: { create: input.includedCategoryIds.map((categoryId) => ({ categoryId })) },
        },
        include: this.include(),
      });
      await tx.auditLog.create({
        data: {
          actorType: 'ADMIN',
          actorId: req.userId,
          targetType: 'PROMOTION',
          targetId: id,
          action: 'PROMOTION_UPDATED',
          oldData: { name: current.name, status: current.status },
          newData: { name: updated.name, status: updated.status },
        },
      });
      return updated;
    });
    res.status(200).json(ResponseFormatter.success(item, 'Promotion updated'));
  }

  private async setStatus(req: Request, res: Response): Promise<void> {
    if (!req.userId) throw new ForbiddenError('Authentication required');
    const id = String(req.params.id || '');
    const status = String((req.body as Record<string, unknown>).status || '').toUpperCase();
    if (!PROMOTION_STATUSES.includes(status)) throw new BadRequestError('Invalid promotion status');
    const updated = await this.prisma.promotion.update({
      where: { id },
      data: { status: status as any },
      include: this.include(),
    });
    await this.prisma.auditLog.create({
      data: {
        actorType: 'ADMIN',
        actorId: req.userId,
        targetType: 'PROMOTION',
        targetId: id,
        action: 'PROMOTION_STATUS_UPDATED',
        newData: { status },
      },
    });
    res.status(200).json(ResponseFormatter.success(updated, 'Promotion status updated'));
  }

  private async previewCart(req: Request, res: Response): Promise<void> {
    const userId = String((req.body as Record<string, unknown>).userId || '').trim();
    if (!userId) throw new BadRequestError('userId is required');
    const result = await this.prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              variant: true,
              product: {
                include: { categories: true },
              },
            },
          },
        },
      });
      if (!cart) return { totalDiscount: 0, allocations: [] };
      const rows = await new PromotionPricingService().calculateForCart({
        tx,
        items: cart.items
          .filter((item) => item.variant)
          .map((item) => ({
            id: item.id,
            productId: item.productId,
            variantId: item.variantId ?? '',
            quantity: item.quantity,
            unitPrice: Number(item.variant?.price ?? item.product.basePrice),
            categoryIds: item.product.categories.map((row) => row.categoryId),
            ancestorCategoryIds: [],
          })),
      });
      return rows;
    });
    res.status(200).json(ResponseFormatter.success(result, 'Promotion preview'));
  }
}
