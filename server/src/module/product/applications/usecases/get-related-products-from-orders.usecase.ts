import { PrismaClient } from '@/generated/prisma/client';
import { GetRelatedProductsFromOrdersQuery } from '../dto/query/get-related-products-from-orders.query';
import {
  RelatedProductsFromOrdersResult,
  RelatedProductItem,
} from '../dto/result/related-products-from-orders.result';
import { IGetRelatedProductsFromOrdersUseCase } from '../ports/input/get-related-products-from-orders.usecase';

export class GetRelatedProductsFromOrdersUseCase
  implements IGetRelatedProductsFromOrdersUseCase
{
  constructor(private readonly prisma: PrismaClient) {}

  async execute(
    userId: string,
    query: GetRelatedProductsFromOrdersQuery,
  ): Promise<RelatedProductsFromOrdersResult> {
    const limitRaw = query.limit;
    const limit =
      typeof limitRaw === 'number' && Number.isFinite(limitRaw)
        ? Math.min(Math.max(Math.floor(limitRaw), 1), 24)
        : 12;

    const purchased = await this.prisma.orderItem.findMany({
      where: {
        order: {
          userId,
          status: {
            in: ['CONFIRMED', 'PAID', 'SHIPPED', 'DELIVERED', 'RETURNED'],
          },
        },
      },
      select: {
        productId: true,
      },
      distinct: ['productId'],
      take: 200,
    });

    const purchasedProductIds = purchased
      .map((p) => p.productId)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);

    if (purchasedProductIds.length === 0) {
      return { products: [] };
    }

    const categoryLinks = await this.prisma.productCategory.findMany({
      where: {
        productId: { in: purchasedProductIds },
      },
      select: {
        categoryId: true,
      },
      distinct: ['categoryId'],
      take: 50,
    });

    const categoryIds = categoryLinks
      .map((c) => c.categoryId)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);

    if (categoryIds.length === 0) {
      return { products: [] };
    }

    const rows = await this.prisma.product.findMany({
      where: {
        isDeleted: false,
        categories: {
          some: {
            categoryId: { in: categoryIds },
          },
        },
        id: {
          notIn: purchasedProductIds,
        },
      },
      take: limit,
      orderBy: [{ createdAt: 'desc' }],
      select: {
        id: true,
        name: true,
        basePrice: true,
        minPrice: true,
        isNew: true,
        isSale: true,
        images: {
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
          take: 1,
          select: {
            url: true,
          },
        },
      },
    });

    const products: RelatedProductItem[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      imageUrl: row.images[0]?.url ?? null,
      minPrice: Number(row.minPrice ?? row.basePrice),
      isNew: row.isNew ?? false,
      isSale: row.isSale ?? false,
    }));

    return { products };
  }
}
