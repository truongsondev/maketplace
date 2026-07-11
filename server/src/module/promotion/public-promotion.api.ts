import express, { type Request, type Response } from 'express';
import type { Prisma, PrismaClient } from '@/generated/prisma/client';
import { BadRequestError } from '../../error-handlling/badRequestError';
import { ResponseFormatter } from '../../shared/server/api-response';
import { asyncHandler } from '../../shared/server/error-middleware';

const activeWhere = (now: Date): Prisma.PromotionWhereInput => ({
  status: { in: ['ACTIVE', 'SCHEDULED'] },
  startAt: { lte: now },
  endAt: { gte: now },
});

export class PublicPromotionAPI {
  readonly router = express.Router();

  constructor(private readonly prisma: PrismaClient) {
    this.router.get('/active', asyncHandler(this.active.bind(this)));
    this.router.get('/:slug/products', asyncHandler(this.products.bind(this)));
    this.router.get('/:slug', asyncHandler(this.detail.bind(this)));
  }

  private async active(_req: Request, res: Response): Promise<void> {
    const items = await this.prisma.promotion.findMany({
      where: activeWhere(new Date()),
      orderBy: [{ isFeatured: 'desc' }, { displayPriority: 'desc' }, { startAt: 'desc' }],
    });
    res.status(200).json(ResponseFormatter.success({ items }));
  }

  private async findActive(slug: string) {
    const item = await this.prisma.promotion.findFirst({
      where: { slug, ...activeWhere(new Date()) },
      include: { includedProducts: true, includedCategories: true },
    });
    if (!item) throw new BadRequestError('Promotion is not active or does not exist');
    return item;
  }

  private async detail(req: Request, res: Response): Promise<void> {
    res.status(200).json(ResponseFormatter.success(await this.findActive(String(req.params.slug))));
  }

  private async products(req: Request, res: Response): Promise<void> {
    const promotion = await this.findActive(String(req.params.slug));
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 24));
    const categoryIds = promotion.includedCategories.map((row) => row.categoryId);
    const productIds = promotion.includedProducts.map((row) => row.productId);
    const scope: Prisma.ProductWhereInput = promotion.scopeType === 'ALL_PRODUCTS'
      ? {}
      : promotion.scopeType === 'INCLUDE_PRODUCTS'
        ? { id: { in: productIds } }
        : promotion.scopeType === 'INCLUDE_CATEGORIES'
          ? { categories: { some: { categoryId: { in: categoryIds } } } }
          : { id: { in: [] as string[] } };
    const where: Prisma.ProductWhereInput = { status: 'ACTIVE', isDeleted: false, ...scope };
    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: { id: true, name: true, images: { take: 1, orderBy: { sortOrder: 'asc' } }, variants: { select: { price: true }, orderBy: { price: 'asc' }, take: 1 } },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);
    const products = items.map((item) => {
      const originalPrice = Number(item.variants[0]?.price ?? 0);
      const value = Number(promotion.value);
      const discount = promotion.type === 'PERCENTAGE'
        ? Math.min(originalPrice * value / 100, promotion.maxDiscount ? Number(promotion.maxDiscount) : Infinity)
        : promotion.type === 'FIXED_AMOUNT' ? value : Math.max(0, originalPrice - value);
      return { id: item.id, name: item.name, imageUrl: item.images[0]?.url ?? null, originalPrice, salePrice: Math.max(0, Math.round(originalPrice - discount)), promotionName: promotion.title };
    });
    res.status(200).json(ResponseFormatter.success({ promotion, products, pagination: { page, limit, total } }));
  }
}
