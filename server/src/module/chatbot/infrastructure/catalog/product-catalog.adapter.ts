import { GetProductsUseCase } from '@/module/product/applications/usecases/get-products.usecase';
import type { PrismaClient } from '@prisma/client';
import {
  ChatbotCatalogProduct,
  ChatbotCatalogSearchInput,
  IChatbotProductCatalog,
} from '../../applications/ports/output/chatbot-product-catalog';

export class ProductCatalogAdapter implements IChatbotProductCatalog {
  constructor(
    private readonly getProductsUseCase: GetProductsUseCase,
    private readonly prisma: PrismaClient,
  ) {}

  async searchProducts(input: ChatbotCatalogSearchInput): Promise<ChatbotCatalogProduct[]> {
    const priceRange =
      input.minPrice !== undefined || input.maxPrice !== undefined
        ? `${input.minPrice ?? ''}-${input.maxPrice ?? ''}`
        : undefined;

    const result = await this.getProductsUseCase.execute({
      page: 1,
      limit: input.limit,
      category: input.category,
      color: input.color,
      size: input.size,
      usageOccasion: input.usageOccasion,
      search: input.search,
      priceRange,
      sort: 'createdAt:desc',
    });

    const products =
      result.products.length > 0
        ? result.products.map((product) => ({
            id: product.id,
            name: product.name,
            imageUrl: product.imageUrl,
            minPrice: Number(product.minPrice),
            href: `/product/${product.id}`,
          }))
        : await this.searchProductsWithRelaxedCatalog(input);

    const productIds = products.map((product) => product.id);
    const metadataRows =
      productIds.length > 0
        ? await this.prisma.product.findMany({
            where: {
              id: { in: productIds },
            },
            select: {
              id: true,
              categories: {
                select: {
                  category: {
                    select: {
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
                    select: {
                      value: true,
                    },
                  },
                  multiSelectOptions: {
                    select: {
                      option: {
                        select: {
                          value: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          })
        : [];

    const metadataById = new Map(
      metadataRows.map((row) => [
        row.id,
        {
          categorySlugs: Array.from(
            new Set(
              (row.categories ?? [])
                .map((item) => item.category?.slug)
                .filter((slug): slug is string => Boolean(slug)),
            ),
          ),
          usageOccasions: Array.from(
            new Set(
              (row.attributeValues ?? []).flatMap((value) => [
                ...(typeof value.option?.value === 'string' ? [value.option.value] : []),
                ...(value.multiSelectOptions ?? [])
                  .map((item) => item.option?.value)
                  .filter((option): option is string => Boolean(option)),
              ]),
            ),
          ),
        },
      ]),
    );

    return products.map((product) => ({
      id: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      minPrice: Number(product.minPrice),
      href: product.href,
      categorySlugs: metadataById.get(product.id)?.categorySlugs ?? [],
      usageOccasions: metadataById.get(product.id)?.usageOccasions ?? [],
    }));
  }

  private async searchProductsWithRelaxedCatalog(
    input: ChatbotCatalogSearchInput,
  ): Promise<Array<Omit<ChatbotCatalogProduct, 'categorySlugs' | 'usageOccasions'>>> {
    const baseWhere = this.buildRelaxedWhere(input, {
      includeCategory: true,
      includeUsageOccasion: true,
      includeSearch: true,
    });

    let rows = await this.findRelaxedProducts(baseWhere, input.limit);

    if (rows.length === 0 && input.search) {
      rows = await this.findRelaxedProducts(
        this.buildRelaxedWhere(input, {
          includeCategory: true,
          includeUsageOccasion: true,
          includeSearch: false,
        }),
        input.limit,
      );
    }

    if (rows.length === 0 && input.usageOccasion) {
      rows = await this.findRelaxedProducts(
        this.buildRelaxedWhere(input, {
          includeCategory: true,
          includeUsageOccasion: false,
          includeSearch: false,
        }),
        input.limit,
      );
    }

    if (rows.length === 0 && input.category) {
      rows = await this.findRelaxedProducts(
        this.buildRelaxedWhere(input, {
          includeCategory: false,
          includeUsageOccasion: false,
          includeSearch: false,
        }),
        input.limit,
      );
    }

    return rows.map((product: any) => {
      const minVariantPrice = product.variants?.[0]?.price;
      const minPrice = Number(product.minPrice ?? minVariantPrice ?? product.basePrice ?? 0);

      return {
        id: product.id,
        name: product.name,
        imageUrl: product.images?.[0]?.url ?? null,
        minPrice,
        href: `/product/${product.id}`,
      };
    });
  }

  private buildRelaxedWhere(
    input: ChatbotCatalogSearchInput,
    options: {
      includeCategory: boolean;
      includeUsageOccasion: boolean;
      includeSearch: boolean;
    },
  ): any {
    const and: any[] = [
      { isDeleted: false },
      { deletedAt: null },
      {
        status: 'ACTIVE',
      },
    ];

    const variantAnd: any[] = [
      { isDeleted: false },
      { deletedAt: null },
      { stockAvailable: { gt: 0 } },
    ];

    if (input.minPrice !== undefined || input.maxPrice !== undefined) {
      variantAnd.push({
        price: {
          ...(input.minPrice !== undefined ? { gte: input.minPrice } : {}),
          ...(input.maxPrice !== undefined ? { lte: input.maxPrice } : {}),
        },
      });
    }

    if (input.color) {
      variantAnd.push(this.buildVariantAttributeFilter('color', input.color));
    }

    if (input.size) {
      variantAnd.push(this.buildVariantAttributeFilter('size', input.size));
    }

    and.push({ variants: { some: { AND: variantAnd } } });

    if (options.includeCategory && input.category) {
      and.push({
        categories: {
          some: {
            category: {
              deletedAt: null,
              OR: [
                { slug: input.category },
                { slug: { contains: input.category } },
                { name: { contains: input.category } },
              ],
            },
          },
        },
      });
    }

    if (options.includeUsageOccasion && input.usageOccasion) {
      and.push(this.buildProductAttributeFilter('usage_occasions', input.usageOccasion));
    }

    if (options.includeSearch && input.search) {
      const normalized = input.search.trim().replace(/\s+/g, ' ');
      const tokens = normalized
        .split(' ')
        .map((token) => token.trim())
        .filter((token) => token.length >= 2)
        .slice(0, 6);

      if (normalized) {
        and.push({
          OR: [
            { name: { contains: normalized } },
            ...tokens.map((token) => ({ name: { contains: token } })),
          ],
        });
      }
    }

    return { AND: and };
  }

  private buildVariantAttributeFilter(code: 'color' | 'size', value: string): any {
    const normalized = this.normalizeOptionValue(value);

    return {
      OR: [
        ...(normalized
          ? [
              {
                attributeValues: {
                  some: {
                    deletedAt: null,
                    attribute: { code },
                    option: { value: normalized },
                  },
                },
              },
            ]
          : []),
        {
          attributeValues: {
            some: {
              deletedAt: null,
              attribute: { code },
              option: { label: { equals: value } },
            },
          },
        },
        { attributes: { path: `$.${code}`, equals: value } },
      ],
    };
  }

  private buildProductAttributeFilter(code: string, value: string): any {
    const normalized = this.normalizeOptionValue(value);

    return {
      attributeValues: {
        some: {
          deletedAt: null,
          attribute: { code },
          OR: [
            ...(normalized
              ? [
                  { option: { value: normalized } },
                  {
                    multiSelectOptions: {
                      some: {
                        option: { value: normalized },
                      },
                    },
                  },
                ]
              : []),
            { option: { label: { equals: value } } },
            {
              multiSelectOptions: {
                some: {
                  option: { label: { equals: value } },
                },
              },
            },
            { textValue: { equals: value } },
          ],
        },
      },
    };
  }

  private async findRelaxedProducts(where: any, limit: number): Promise<any[]> {
    return this.prisma.product.findMany({
      where,
      orderBy: [{ isSale: 'desc' }, { isNew: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      select: {
        id: true,
        name: true,
        basePrice: true,
        minPrice: true,
        images: {
          where: { isPrimary: true },
          take: 1,
          select: { url: true },
        },
        variants: {
          where: {
            isDeleted: false,
            deletedAt: null,
            stockAvailable: { gt: 0 },
          },
          orderBy: { price: 'asc' },
          take: 1,
          select: { price: true },
        },
      },
    });
  }

  private normalizeOptionValue(raw: string): string | null {
    const value = raw.trim();
    if (!value) return null;

    const normalized = value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_\-]/g, '');

    return normalized || null;
  }
}
