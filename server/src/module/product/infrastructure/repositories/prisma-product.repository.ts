import { PrismaClient } from '@/generated/prisma/client';
import {
  IProductRepository,
  ProductFilters,
  PaginationParams,
} from '../../applications/ports/output/product.repository';
import { Product } from '../../entities/product/product.entity';

export class PrismaProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findWithFilters(
    filters: ProductFilters,
    pagination: PaginationParams,
  ): Promise<{ products: Product[]; total: number }> {
    const where: any = {
      isDeleted: false,
    };

    // Filter by category (slug or id)
    if (filters.categorySlugOrId) {
      where.categories = {
        some: {
          category: {
            OR: [{ slug: filters.categorySlugOrId }, { id: filters.categorySlugOrId }],
          },
        },
      };
    }

    // Filter by size or color (check in variant attributes)
    if (filters.size || filters.color) {
      where.variants = {
        some: {
          AND: [
            filters.size ? { attributes: { path: '$.size', equals: filters.size } } : {},
            filters.color ? { attributes: { path: '$.color', equals: filters.color } } : {},
          ],
        },
      };
    }

    // Filter by price range (check min variant price)
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.variants = {
        some: {
          ...(where.variants?.some || {}),
          price: {
            ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
            ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
          },
        },
      };
    }

    const skip = (pagination.page - 1) * pagination.limit;

    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: pagination.limit,
        include: {
          variants: {
            where: { stockAvailable: { gt: 0 } },
            orderBy: { price: 'asc' },
            take: 1,
          },
          images: {
            where: { isPrimary: true },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products: rows.map((row) => this.toDomain(row)),
      total,
    };
  }

  async findByIdWithDetails(id: string): Promise<Product | null> {
    const row = await this.prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          where: { isDeleted: false },
          include: {
            images: {
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        images: {
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        },
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        reviews: true,
      },
    });

    if (!row) {
      return null;
    }

    return Product.fromPersistenceWithDetails(row);
  }

  private toDomain(row: any): Product {
    const minPrice = row.variants[0]?.price ?? row.basePrice ?? 0;
    const imageUrl = row.images[0]?.url ?? null;

    return Product.fromPersistence({
      id: row.id,
      name: row.name,
      slug: row.slug,
      imageUrl,
      minPrice,
      originalPrice: undefined,
      discountPercent: undefined,
    });
  }
}
