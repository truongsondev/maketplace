import { PrismaClient } from '@/generated/prisma/client';
import {
  CategoryShowcase,
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
        orderBy: {
          [filters.sortField ?? 'createdAt']: filters.sortOrder ?? 'desc',
        },
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

  async findCategoryShowcases(
    categoryLimit: number,
    productLimit: number,
  ): Promise<CategoryShowcase[]> {
    try {
      const rows = await this.prisma.category.findMany({
        where: {
          products: {
            some: {
              product: {
                isDeleted: false,
              },
            },
          },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
          products: {
            where: {
              product: {
                isDeleted: false,
              },
            },
            take: productLimit,
            orderBy: {
              product: {
                createdAt: 'desc',
              },
            },
            select: {
              product: {
                select: {
                  id: true,
                  name: true,
                  basePrice: true,
                  isNew: true,
                  isSale: true,
                  variants: {
                    where: {
                      isDeleted: false,
                    },
                    orderBy: {
                      price: 'asc',
                    },
                    take: 1,
                    select: {
                      price: true,
                    },
                  },
                  images: {
                    where: {
                      isPrimary: true,
                    },
                    take: 1,
                    select: {
                      url: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        take: categoryLimit,
      });

      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        imageUrl: row.imageUrl,
        products: row.products.map((item) => ({
          id: item.product.id,
          name: item.product.name,
          imageUrl: item.product.images[0]?.url ?? null,
          minPrice: Number(item.product.variants[0]?.price ?? item.product.basePrice),
          isNew: item.product.isNew,
          isSale: item.product.isSale,
        })),
      }));
    } catch (error) {
      const isUnknownIsNewFieldError =
        error instanceof Error &&
        (error.message.includes('Unknown field `isNew`') ||
          error.message.includes('Unknown field `isSale`'));

      if (!isUnknownIsNewFieldError) {
        throw error;
      }

      const rows = await this.prisma.category.findMany({
        where: {
          products: {
            some: {
              product: {
                isDeleted: false,
              },
            },
          },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
          products: {
            where: {
              product: {
                isDeleted: false,
              },
            },
            take: productLimit,
            orderBy: {
              product: {
                createdAt: 'desc',
              },
            },
            select: {
              product: {
                select: {
                  id: true,
                  name: true,
                  basePrice: true,
                  variants: {
                    where: {
                      isDeleted: false,
                    },
                    orderBy: {
                      price: 'asc',
                    },
                    take: 1,
                    select: {
                      price: true,
                    },
                  },
                  images: {
                    where: {
                      isPrimary: true,
                    },
                    take: 1,
                    select: {
                      url: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        take: categoryLimit,
      });

      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        imageUrl: row.imageUrl,
        products: row.products.map((item) => ({
          id: item.product.id,
          name: item.product.name,
          imageUrl: item.product.images[0]?.url ?? null,
          minPrice: Number(item.product.variants[0]?.price ?? item.product.basePrice),
          isNew: false,
          isSale: false,
        })),
      }));
    }
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
      isNew: row.isNew ?? false,
      isSale: row.isSale ?? false,
    });
  }
}
