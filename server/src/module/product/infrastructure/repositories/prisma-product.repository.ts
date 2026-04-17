import { PrismaClient } from '@/generated/prisma/client';
import {
  CategoryShowcase,
  IProductRepository,
  ProductFilters,
  PaginationParams,
} from '../../applications/ports/output/product.repository';
import { ProductListAggregations } from '../../applications/dto/result/product-list.result';
import { Product } from '../../entities/product/product.entity';

function normalizeOptionValue(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  const value = String(raw).trim();
  if (!value) return null;

  const ascii = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');

  const normalized = ascii
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_\-]/g, '');

  return normalized || null;
}

function slugFromName(raw: unknown): string {
  const name = String(raw ?? '').trim();
  if (!name) return '';

  const ascii = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');

  return ascii
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export class PrismaProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private mergeVariantAttributesFromAttributeValues(variant: any): any {
    const merged: Record<string, any> = {
      ...(variant?.attributes && typeof variant.attributes === 'object' ? variant.attributes : {}),
    };

    const attributeValues: any[] = Array.isArray(variant?.attributeValues)
      ? variant.attributeValues
      : [];

    for (const av of attributeValues) {
      const code = av?.attribute?.code;
      if (!code || typeof code !== 'string') continue;

      const raw = av?.option?.label ?? av?.textValue;
      if (raw === null || raw === undefined) continue;

      const value = String(raw).trim();
      if (!value) continue;

      merged[code] = value;
    }

    return {
      ...variant,
      attributes: merged,
    };
  }

  private async resolveCategoryDescendantIds(
    categorySlugOrId: string,
  ): Promise<Set<string> | null> {
    const baseCategory = await this.prisma.category.findFirst({
      where: {
        OR: [{ id: categorySlugOrId }, { slug: categorySlugOrId }],
      },
      select: {
        id: true,
      },
    });

    if (!baseCategory) return null;

    const categories = await this.prisma.category.findMany({
      select: {
        id: true,
        parentId: true,
      },
    });

    const childrenByParentId = new Map<string, string[]>();
    for (const c of categories) {
      if (!c.parentId) continue;
      const list = childrenByParentId.get(c.parentId) ?? [];
      list.push(c.id);
      childrenByParentId.set(c.parentId, list);
    }

    const descendantIds = new Set<string>();
    const stack: string[] = [baseCategory.id];

    while (stack.length > 0) {
      const currentId = stack.pop()!;
      if (descendantIds.has(currentId)) continue;
      descendantIds.add(currentId);

      const children = childrenByParentId.get(currentId) ?? [];
      for (const childId of children) {
        if (!descendantIds.has(childId)) {
          stack.push(childId);
        }
      }
    }

    return descendantIds;
  }

  private buildVariantAndForFacetQuery(
    filters: ProductFilters,
    opts: { omitSize?: boolean; omitColor?: boolean },
  ): any[] {
    const variantAnd: any[] = [{ isDeleted: false }];

    // NOTE: facet query is purely relational (VariantAttributeValue); we intentionally do not
    // include legacy JSON-path fallback here.
    if (filters.size && !opts.omitSize) {
      const norm = normalizeOptionValue(filters.size);
      variantAnd.push({
        OR: [
          ...(norm
            ? [
                {
                  attributeValues: {
                    some: {
                      attribute: { code: 'size' },
                      option: { value: norm },
                      deletedAt: null,
                    },
                  },
                },
              ]
            : []),
          {
            attributeValues: {
              some: {
                attribute: { code: 'size' },
                option: { label: { equals: filters.size } },
                deletedAt: null,
              },
            },
          },
        ],
      });
    }

    if (filters.color && !opts.omitColor) {
      const norm = normalizeOptionValue(filters.color);
      variantAnd.push({
        OR: [
          ...(norm
            ? [
                {
                  attributeValues: {
                    some: {
                      attribute: { code: 'color' },
                      option: { value: norm },
                      deletedAt: null,
                    },
                  },
                },
              ]
            : []),
          {
            attributeValues: {
              some: {
                attribute: { code: 'color' },
                option: { label: { equals: filters.color } },
                deletedAt: null,
              },
            },
          },
        ],
      });
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      variantAnd.push({
        price: {
          ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
          ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
        },
      });
    }

    return variantAnd;
  }

  private async getAggregations(
    filters: ProductFilters,
    productWhere: any,
  ): Promise<ProductListAggregations> {
    const buildAxis = async (
      axis: 'size' | 'color',
      omit: { omitSize?: boolean; omitColor?: boolean },
    ) => {
      const variantAnd = this.buildVariantAndForFacetQuery(filters, omit);

      const groups = await this.prisma.variantAttributeValue.groupBy({
        by: ['optionId'],
        where: {
          deletedAt: null,
          optionId: { not: null },
          attribute: { code: axis },
          option: { deletedAt: null },
          variant: {
            AND: variantAnd,
            product: productWhere ?? { isDeleted: false },
          },
        },
        _count: { _all: true },
      });

      const optionIds = groups
        .map((g: any) => g.optionId)
        .filter((id: any): id is string => typeof id === 'string');

      if (optionIds.length === 0) return [];

      const options = await this.prisma.attributeOption.findMany({
        where: {
          id: { in: optionIds },
          deletedAt: null,
        },
        select: {
          id: true,
          value: true,
          label: true,
          sortOrder: true,
        },
        orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
      });

      const countByOptionId = new Map<string, number>(
        groups.map((g: any) => [g.optionId as string, g._count?._all ?? 0]),
      );

      return options.map((o: any) => ({
        value: o.value,
        label: o.label,
        count: countByOptionId.get(o.id) ?? 0,
      }));
    };

    const [sizes, colors] = await Promise.all([
      buildAxis('size', { omitSize: true, omitColor: false }),
      buildAxis('color', { omitSize: false, omitColor: true }),
    ]);

    return { sizes, colors };
  }

  async findWithFilters(
    filters: ProductFilters,
    pagination: PaginationParams,
  ): Promise<{ products: Product[]; total: number; aggregations?: ProductListAggregations }> {
    const productWhere: any = { isDeleted: false };

    let categoryWhere: any = undefined;

    const variantAnd: any[] = [{ isDeleted: false }];

    // Filter by category (slug or id)
    if (filters.categorySlugOrId) {
      const categoryInput = filters.categorySlugOrId;

      const descendantIds = await this.resolveCategoryDescendantIds(categoryInput);

      if (!descendantIds) {
        return { products: [], total: 0, aggregations: { sizes: [], colors: [] } };
      }

      categoryWhere = {
        categories: {
          some: {
            categoryId: {
              in: Array.from(descendantIds),
            },
          },
        },
      };

      Object.assign(productWhere, categoryWhere);
    }

    // Filter by size/color (prefer VariantAttributeValue, fallback to legacy JSON during migration)
    if (filters.size) {
      const norm = normalizeOptionValue(filters.size);
      variantAnd.push({
        OR: [
          ...(norm
            ? [
                {
                  attributeValues: {
                    some: {
                      attribute: { code: 'size' },
                      option: { value: norm },
                      deletedAt: null,
                    },
                  },
                },
              ]
            : []),
          {
            attributeValues: {
              some: {
                attribute: { code: 'size' },
                option: { label: { equals: filters.size } },
                deletedAt: null,
              },
            },
          },
          { attributes: { path: '$.size', equals: filters.size } },
        ],
      });
    }

    if (filters.color) {
      const norm = normalizeOptionValue(filters.color);
      variantAnd.push({
        OR: [
          ...(norm
            ? [
                {
                  attributeValues: {
                    some: {
                      attribute: { code: 'color' },
                      option: { value: norm },
                      deletedAt: null,
                    },
                  },
                },
              ]
            : []),
          {
            attributeValues: {
              some: {
                attribute: { code: 'color' },
                option: { label: { equals: filters.color } },
                deletedAt: null,
              },
            },
          },
          { attributes: { path: '$.color', equals: filters.color } },
        ],
      });
    }

    // Filter by price range (check variant price)
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      variantAnd.push({
        price: {
          ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
          ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
        },
      });
    }

    if (filters.search) {
      const normalized = filters.search.trim();
      if (normalized) {
        productWhere.OR = [{ name: { contains: normalized } }];
      }
    }

    const where: any = { ...productWhere };

    // Apply variant constraints only when needed
    if (variantAnd.length > 1) {
      where.variants = { some: { AND: variantAnd } };
    }

    const skip = (pagination.page - 1) * pagination.limit;

    const [rows, total, aggregations] = await Promise.all([
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
      this.getAggregations(filters, productWhere),
    ]);

    return {
      products: rows.map((row) => this.toDomain(row)),
      total,
      aggregations,
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
            attributeValues: {
              where: {
                deletedAt: null,
                attribute: { deletedAt: null },
              },
              include: {
                attribute: { select: { code: true } },
                option: { select: { value: true, label: true, deletedAt: true } },
              },
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
        reviews: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                email: true,
                phone: true,
              },
            },
            images: {
              orderBy: { sortOrder: 'asc' },
              select: {
                url: true,
                sortOrder: true,
              },
            },
          },
        },
      },
    });

    if (!row) {
      return null;
    }

    const normalizedRow: any = {
      ...row,
      // NOTE: Product currently has no `slug` column in the Prisma schema.
      // Keep API response stable by deriving a slug from the name.
      slug: (row as any).slug ?? slugFromName((row as any).name),
      variants: (row.variants ?? []).map((v: any) =>
        this.mergeVariantAttributesFromAttributeValues(v),
      ),
    };

    return Product.fromPersistenceWithDetails(normalizedRow);
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
      slug: row.slug ?? slugFromName(row.name),
      imageUrl,
      minPrice,
      originalPrice: undefined,
      discountPercent: undefined,
      isNew: row.isNew ?? false,
      isSale: row.isSale ?? false,
    });
  }
}
