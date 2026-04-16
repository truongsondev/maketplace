import { Prisma, PrismaClient } from '@/generated/prisma/client';
import {
  IWishlistRepository,
  FavoriteProductSummary,
  FavoriteProductListItem,
  UpsertFavoriteResult,
} from '../../applications/ports/output/wishlist.repository';

export class PrismaWishlistRepository implements IWishlistRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findActiveProductById(productId: string): Promise<FavoriteProductSummary | null> {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!product) {
      return null;
    }

    return {
      id: product.id,
      name: product.name,
    };
  }

  async upsertFavorite(userId: string, productId: string): Promise<UpsertFavoriteResult> {
    const existing = await this.prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    if (existing) {
      return {
        wishlistId: existing.id,
        created: false,
        createdAt: existing.createdAt,
      };
    }

    try {
      const created = await this.prisma.wishlist.create({
        data: {
          userId,
          productId,
        },
        select: {
          id: true,
          createdAt: true,
        },
      });

      return {
        wishlistId: created.id,
        created: true,
        createdAt: created.createdAt,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const duplicated = await this.prisma.wishlist.findUnique({
          where: {
            userId_productId: {
              userId,
              productId,
            },
          },
          select: {
            id: true,
            createdAt: true,
          },
        });

        if (duplicated) {
          return {
            wishlistId: duplicated.id,
            created: false,
            createdAt: duplicated.createdAt,
          };
        }
      }

      throw error;
    }
  }

  async removeFavorite(userId: string, productId: string): Promise<boolean> {
    const result = await this.prisma.wishlist.deleteMany({
      where: {
        userId,
        productId,
      },
    });

    return result.count > 0;
  }

  async findFavoritesByUser(
    userId: string,
    pagination: { page: number; limit: number },
  ): Promise<{ items: FavoriteProductListItem[]; total: number }> {
    const skip = (pagination.page - 1) * pagination.limit;

    const where = {
      userId,
      product: {
        isDeleted: false,
      },
    } as const;

    const [rows, total] = await Promise.all([
      this.prisma.wishlist.findMany({
        where,
        skip,
        take: pagination.limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          product: {
            include: {
              variants: {
                where: { isDeleted: false },
                orderBy: { price: 'asc' },
                take: 1,
              },
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
        },
      }),
      this.prisma.wishlist.count({ where }),
    ]);

    return {
      items: rows.map((row) => ({
        productId: row.product.id,
        name: row.product.name,
        slug: (row.product as any).slug ?? '',
        imageUrl: row.product.images[0]?.url ?? null,
        minPrice: Number(row.product.variants[0]?.price ?? row.product.basePrice),
        favoritedAt: row.createdAt,
      })),
      total,
    };
  }
}
