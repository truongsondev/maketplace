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

  private mapProductAttributesFromAttributeValues(attributeValues: any[]): Array<{
    code: string;
    name: string;
    dataType: string;
    value: unknown;
    displayValue: string | string[] | null;
  }> {
    return (attributeValues ?? []).map((av: any) => {
      const dataType = String(av?.attribute?.dataType ?? 'TEXT');

      if (dataType === 'MULTI_SELECT') {
        const options = (av?.multiSelectOptions ?? [])
          .map((item: any) => item.option)
          .filter((opt: any) => opt && !opt.deletedAt)
          .sort((a: any, b: any) => {
            const ao = Number(a.sortOrder ?? 0);
            const bo = Number(b.sortOrder ?? 0);
            if (ao !== bo) return ao - bo;
            return String(a.label ?? '').localeCompare(String(b.label ?? ''));
          });

        return {
          code: av.attribute.code,
          name: av.attribute.name,
          dataType,
          value: options.map((opt: any) => String(opt.value)),
          displayValue: options.map((opt: any) => String(opt.label)),
        };
      }

      if (dataType === 'SELECT') {
        return {
          code: av.attribute.code,
          name: av.attribute.name,
          dataType,
          value: av.option?.value ?? null,
          displayValue: av.option?.label ?? null,
        };
      }

      if (dataType === 'NUMBER') {
        const value =
          av.numberValue === null || av.numberValue === undefined ? null : Number(av.numberValue);
        return {
          code: av.attribute.code,
          name: av.attribute.name,
          dataType,
          value,
          displayValue: value === null ? null : String(value),
        };
      }

      if (dataType === 'BOOLEAN') {
        const value =
          av.booleanValue === null || av.booleanValue === undefined
            ? null
            : Boolean(av.booleanValue);
        return {
          code: av.attribute.code,
          name: av.attribute.name,
          dataType,
          value,
          displayValue: value === null ? null : value ? 'Có' : 'Không',
        };
      }

      if (dataType === 'DATE') {
        const value = av.dateValue ? new Date(av.dateValue).toISOString() : null;
        return {
          code: av.attribute.code,
          name: av.attribute.name,
          dataType,
          value,
          displayValue: value,
        };
      }

      const text = av.textValue ? String(av.textValue) : null;
      return {
        code: av.attribute.code,
        name: av.attribute.name,
        dataType,
        value: text,
        displayValue: text,
      };
    });
  }

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
    const normalizedCategoryInput = categorySlugOrId.trim();
    if (!normalizedCategoryInput) return null;

    const baseCategory = await this.prisma.category.findFirst({
      where: {
        deletedAt: null,
        OR: [{ id: normalizedCategoryInput }, { slug: normalizedCategoryInput }],
      },
      select: {
        id: true,
      },
    });

    const fallbackCategory =
      baseCategory ??
      (await this.prisma.category.findFirst({
        where: {
          deletedAt: null,
          OR: [
            { slug: { contains: normalizedCategoryInput } },
            { name: { contains: normalizedCategoryInput } },
          ],
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        select: {
          id: true,
        },
      }));

    if (!fallbackCategory) return null;

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
    const stack: string[] = [fallbackCategory.id];

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

  private collectDescendantCategoryIds(
    rootId: string,
    childrenByParentId: Map<string, string[]>,
  ): string[] {
    const visited = new Set<string>();
    const stack: string[] = [rootId];

    while (stack.length > 0) {
      const currentId = stack.pop()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const children = childrenByParentId.get(currentId) ?? [];
      for (const childId of children) {
        if (!visited.has(childId)) {
          stack.push(childId);
        }
      }
    }

    return Array.from(visited);
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

    if (filters.usageOccasion) {
      const normalizedUsage = normalizeOptionValue(filters.usageOccasion);

      productWhere.AND = [
        ...(productWhere.AND ?? []),
        {
          attributeValues: {
            some: {
              deletedAt: null,
              attribute: { code: 'usage_occasions' },
              OR: [
                ...(normalizedUsage
                  ? [
                      { option: { value: normalizedUsage } },
                      {
                        multiSelectOptions: {
                          some: {
                            option: { value: normalizedUsage },
                          },
                        },
                      },
                    ]
                  : []),
                { option: { label: { equals: filters.usageOccasion } } },
                {
                  multiSelectOptions: {
                    some: {
                      option: { label: { equals: filters.usageOccasion } },
                    },
                  },
                },
                { textValue: { equals: filters.usageOccasion } },
              ],
            },
          },
        },
      ];
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
      const normalized = filters.search.trim().replace(/\s+/g, ' ');
      if (normalized) {
        const tokens = Array.from(
          new Set(
            normalized
              .split(' ')
              .map((token) => token.trim())
              .filter((token) => token.length >= 2),
          ),
        ).slice(0, 8);

        const searchOr: any[] = [{ name: { contains: normalized } }];
        for (const token of tokens) {
          searchOr.push({ name: { contains: token } });
        }

        productWhere.AND = [...(productWhere.AND ?? []), { OR: searchOr }];
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
        attributeValues: {
          where: {
            deletedAt: null,
            attribute: { deletedAt: null, scope: 'PRODUCT' },
          },
          include: {
            attribute: {
              select: {
                code: true,
                name: true,
                dataType: true,
              },
            },
            option: {
              select: {
                value: true,
                label: true,
                deletedAt: true,
              },
            },
            multiSelectOptions: {
              include: {
                option: {
                  select: {
                    value: true,
                    label: true,
                    sortOrder: true,
                    deletedAt: true,
                  },
                },
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
      productAttributes: this.mapProductAttributesFromAttributeValues(
        (row as any).attributeValues ?? [],
      ),
    };

    return Product.fromPersistenceWithDetails(normalizedRow);
  }

  async findCategoryShowcases(
    categoryLimit: number,
    productLimit: number,
  ): Promise<CategoryShowcase[]> {
    const categories = await this.prisma.category.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        parentId: true,
        sortOrder: true,
        createdAt: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    const childrenByParentId = new Map<string, string[]>();
    for (const category of categories) {
      if (!category.parentId) continue;
      const bucket = childrenByParentId.get(category.parentId) ?? [];
      bucket.push(category.id);
      childrenByParentId.set(category.parentId, bucket);
    }

    const rootCategories = categories.filter((category) => !category.parentId);

    const buildShowcases = async (includePromotionFlags: boolean): Promise<CategoryShowcase[]> => {
      const showcases: CategoryShowcase[] = [];

      for (const root of rootCategories) {
        if (showcases.length >= categoryLimit) break;

        const descendantIds = this.collectDescendantCategoryIds(root.id, childrenByParentId);

        const productSelect: any = {
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
        };

        if (includePromotionFlags) {
          productSelect.isNew = true;
          productSelect.isSale = true;
        }

        const products = await this.prisma.product.findMany({
          where: {
            isDeleted: false,
            categories: {
              some: {
                categoryId: {
                  in: descendantIds,
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: productLimit,
          select: productSelect,
        });

        if (products.length === 0) continue;

        showcases.push({
          id: root.id,
          name: root.name,
          slug: root.slug,
          imageUrl: root.imageUrl,
          products: products.map((product: any) => ({
            id: product.id,
            name: product.name,
            imageUrl: product.images[0]?.url ?? null,
            minPrice: Number(product.variants[0]?.price ?? product.basePrice),
            isNew: includePromotionFlags ? Boolean(product.isNew) : false,
            isSale: includePromotionFlags ? Boolean(product.isSale) : false,
          })),
        });
      }

      return showcases;
    };

    try {
      return await buildShowcases(true);
    } catch (error) {
      const isUnknownIsNewFieldError =
        error instanceof Error &&
        (error.message.includes('Unknown field `isNew`') ||
          error.message.includes('Unknown field `isSale`'));

      if (!isUnknownIsNewFieldError) {
        throw error;
      }

      return buildShowcases(false);
    }
  }

  private pickCollection(product: any): { slug: string; name: string } {
    const category = product?.categories?.[0]?.category;
    return {
      slug: String(category?.slug ?? 'ao').trim() || 'ao',
      name: String(category?.name ?? 'Bst Moi').trim() || 'Bst Moi',
    };
  }

  private pickProductImage(product: any): string | null {
    const image = product?.images?.[0]?.url;
    if (typeof image === 'string' && image.trim()) {
      return image.trim();
    }
    return null;
  }

  private extractUsageOccasions(product: any): string[] {
    const values: string[] = [];
    const attributeValues = Array.isArray(product?.attributeValues) ? product.attributeValues : [];

    for (const av of attributeValues) {
      if (av?.attribute?.code !== 'usage_occasions') continue;

      if (typeof av?.option?.value === 'string' && av.option.value.trim()) {
        values.push(av.option.value.trim());
      }

      const joins = Array.isArray(av?.multiSelectOptions) ? av.multiSelectOptions : [];
      for (const join of joins) {
        if (typeof join?.option?.value === 'string' && join.option.value.trim()) {
          values.push(join.option.value.trim());
        }
      }
    }

    return Array.from(new Set(values));
  }

  async findHomeTeamContent() {
    const products = await this.prisma.product.findMany({
      where: {
        isDeleted: false,
        deletedAt: null,
        images: {
          some: {},
        },
        variants: {
          some: {
            isDeleted: false,
            stockAvailable: { gt: 0 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 48,
      select: {
        id: true,
        name: true,
        description: true,
        images: {
          where: { isPrimary: true },
          take: 1,
          select: { url: true },
        },
        categories: {
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
          take: 1,
          include: {
            category: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
        attributeValues: {
          where: {
            deletedAt: null,
            attribute: { code: 'usage_occasions' },
          },
          select: {
            option: {
              select: { value: true },
            },
            multiSelectOptions: {
              select: {
                option: {
                  select: { value: true },
                },
              },
            },
            attribute: {
              select: { code: true },
            },
          },
        },
      },
    });

    const withImage = products.filter((product: any) => Boolean(this.pickProductImage(product)));
    if (withImage.length === 0) {
      return {
        teamCards: [],
        highlights: [],
        gallery: [],
      };
    }

    const usageByProductId = new Map<string, string[]>();
    for (const product of withImage) {
      usageByProductId.set(product.id, this.extractUsageOccasions(product));
    }

    const usedIds = new Set<string>();
    const teamCandidates: any[] = [];

    const sportsProduct = withImage.find((product: any) => {
      const usages = usageByProductId.get(product.id) ?? [];
      return usages.includes('tap_the_thao');
    });

    if (sportsProduct) {
      teamCandidates.push(sportsProduct);
      usedIds.add(sportsProduct.id);
    }

    for (const product of withImage) {
      if (teamCandidates.length >= 3) break;
      if (usedIds.has(product.id)) continue;
      teamCandidates.push(product);
      usedIds.add(product.id);
    }

    const teamCards = teamCandidates.map((product: any, index: number) => {
      const imageUrl = this.pickProductImage(product)!;
      const collection = this.pickCollection(product);
      const usages = usageByProductId.get(product.id) ?? [];
      const usageOccasion = usages.includes('tap_the_thao') ? 'tap_the_thao' : undefined;

      return {
        id: `team-${product.id}`,
        title: String(product.name),
        description:
          String(product.description ?? '').trim() ||
          `Goi y phoi do linh hoat tu bo suu tap ${collection.name}.`,
        imageUrl,
        collectionSlug: collection.slug,
        query: String(product.name ?? '').trim(),
        usageOccasion,
        scope: usageOccasion ? ('all' as const) : undefined,
        sortOrder: index,
      };
    });

    const highlightCandidates = withImage
      .filter((product: any) => !usedIds.has(product.id))
      .slice(0, 2);
    const highlights = highlightCandidates.map((product: any, index: number) => {
      const imageUrl = this.pickProductImage(product)!;
      const collection = this.pickCollection(product);
      const subtitle = index === 0 ? 'Work Fit' : 'Weekend Fit';
      const title = index === 0 ? 'Di lam' : 'Di choi';

      return {
        id: `highlight-${product.id}`,
        title,
        subtitle,
        description:
          String(product.description ?? '').trim() ||
          `Kham pha ${collection.name.toLowerCase()} de de dang phoi do moi ngay.`,
        imageUrl,
        ctaLabel: index === 0 ? 'Xem do di lam' : 'Xem do di choi',
        collectionSlug: collection.slug,
        query: collection.name,
      };
    });

    const gallery = withImage.slice(0, 12).map((product: any) => {
      const imageUrl = this.pickProductImage(product)!;
      const collection = this.pickCollection(product);
      const usages = usageByProductId.get(product.id) ?? [];
      const usageOccasion = usages.includes('tap_the_thao') ? 'tap_the_thao' : undefined;

      return {
        id: `gallery-${product.id}`,
        imageUrl,
        collectionSlug: collection.slug,
        query: String(product.name ?? '').trim(),
        usageOccasion,
      };
    });

    return {
      teamCards,
      highlights,
      gallery,
    };
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
