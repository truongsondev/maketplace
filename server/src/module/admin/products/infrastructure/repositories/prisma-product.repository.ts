import { PrismaClient, Prisma } from '../../../../../../generated/prisma/client';
import { Product, ProductVariant, ProductImageProps } from '../../entities/product/product.entity';
import { IProductRepository } from '../../applications/ports/output/product.repository';
import { buildVariantOptionKeyFromAttributes } from '@/shared/util/variant-option-key';

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

type ProductAttributeInput = {
  code: string;
  value: unknown;
};

export class PrismaProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private parseBooleanValue(raw: unknown): boolean {
    if (typeof raw === 'boolean') return raw;
    if (raw === 1 || raw === '1') return true;
    if (raw === 0 || raw === '0') return false;
    if (typeof raw === 'string') {
      const normalized = raw.trim().toLowerCase();
      if (normalized === 'true') return true;
      if (normalized === 'false') return false;
    }
    throw new Error('Invalid boolean value');
  }

  private mapProductAttributeDetails(attributeValues: any[]): Array<{
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
            const soA = Number(a.sortOrder ?? 0);
            const soB = Number(b.sortOrder ?? 0);
            if (soA !== soB) return soA - soB;
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

  private async syncProductAttributes(
    tx: Prisma.TransactionClient,
    productId: string,
    productTypeId: string | null | undefined,
    productAttributes: ProductAttributeInput[],
  ): Promise<void> {
    if (!Array.isArray(productAttributes)) {
      return;
    }

    const cleaned = productAttributes
      .filter((attr) => attr && typeof attr.code === 'string')
      .map((attr) => ({
        code: attr.code.trim(),
        value: attr.value,
      }))
      .filter((attr) => attr.code.length > 0);

    if (cleaned.length === 0) {
      await tx.productAttributeValue.deleteMany({
        where: {
          productId,
          attribute: {
            scope: 'PRODUCT',
          },
        },
      });
      return;
    }

    const uniqueByCode = new Map<string, unknown>();
    for (const attr of cleaned) {
      uniqueByCode.set(attr.code, attr.value);
    }

    const codes = Array.from(uniqueByCode.keys());
    const definitions = await tx.attributeDefinition.findMany({
      where: {
        code: { in: codes },
        scope: 'PRODUCT',
        deletedAt: null,
      },
      include: {
        options: {
          where: { deletedAt: null },
          select: {
            id: true,
            value: true,
            label: true,
            sortOrder: true,
            deletedAt: true,
          },
        },
      },
    });

    if (definitions.length !== codes.length) {
      const foundCodes = new Set(definitions.map((d) => d.code));
      const missing = codes.filter((code) => !foundCodes.has(code));
      throw new Error(`Unknown product attributes: ${missing.join(', ')}`);
    }

    if (productTypeId) {
      const maps = await tx.productTypeAttribute.findMany({
        where: {
          productTypeId,
          attributeId: { in: definitions.map((d) => d.id) },
        },
        select: { attributeId: true },
      });

      const mappedIds = new Set(maps.map((m) => m.attributeId));
      const invalidCodes = definitions.filter((d) => !mappedIds.has(d.id)).map((d) => d.code);

      if (invalidCodes.length > 0) {
        throw new Error(`Attributes are not mapped to product type: ${invalidCodes.join(', ')}`);
      }
    }

    for (const definition of definitions) {
      const rawValue = uniqueByCode.get(definition.code);
      const dataType = String(definition.dataType);

      const optionByValue = new Map(
        definition.options.map((opt) => [String(opt.value), opt] as const),
      );
      const optionByLabel = new Map(
        definition.options.map((opt) => [String(opt.label), opt] as const),
      );

      let textValue: string | null = null;
      let numberValue: number | null = null;
      let booleanValue: boolean | null = null;
      let dateValue: Date | null = null;
      let optionId: string | null = null;
      let multiOptionIds: string[] = [];

      if (dataType === 'SELECT') {
        const normalized = String(rawValue ?? '').trim();
        if (!normalized) {
          throw new Error(`Attribute ${definition.code} requires a selected option`);
        }

        const option = optionByValue.get(normalized) ?? optionByLabel.get(normalized);
        if (!option) {
          throw new Error(`Invalid option for ${definition.code}: ${normalized}`);
        }
        optionId = option.id;
      } else if (dataType === 'MULTI_SELECT') {
        const values = Array.isArray(rawValue) ? rawValue : [];
        const normalizedValues = values
          .map((item) => String(item).trim())
          .filter((item) => item.length > 0);

        if (normalizedValues.length === 0) {
          throw new Error(`Attribute ${definition.code} requires at least one selected option`);
        }

        const ids = normalizedValues.map((item) => {
          const option = optionByValue.get(item) ?? optionByLabel.get(item);
          if (!option) {
            throw new Error(`Invalid option for ${definition.code}: ${item}`);
          }
          return option.id;
        });

        multiOptionIds = Array.from(new Set(ids));
      } else if (dataType === 'NUMBER') {
        const parsed = Number(rawValue);
        if (!Number.isFinite(parsed)) {
          throw new Error(`Attribute ${definition.code} requires a valid number`);
        }
        numberValue = parsed;
      } else if (dataType === 'BOOLEAN') {
        booleanValue = this.parseBooleanValue(rawValue);
      } else if (dataType === 'DATE') {
        const parsedDate = new Date(String(rawValue ?? ''));
        if (Number.isNaN(parsedDate.getTime())) {
          throw new Error(`Attribute ${definition.code} requires a valid date`);
        }
        dateValue = parsedDate;
      } else {
        const text = String(rawValue ?? '').trim();
        if (!text) {
          throw new Error(`Attribute ${definition.code} requires a text value`);
        }
        textValue = text;
      }

      const savedValue = await tx.productAttributeValue.upsert({
        where: {
          productId_attributeId: {
            productId,
            attributeId: definition.id,
          },
        },
        update: {
          textValue,
          numberValue,
          booleanValue,
          dateValue,
          optionId,
          deletedAt: null,
        },
        create: {
          productId,
          attributeId: definition.id,
          textValue,
          numberValue,
          booleanValue,
          dateValue,
          optionId,
          deletedAt: null,
        },
        select: { id: true },
      });

      await tx.productAttributeValueOption.deleteMany({
        where: { productAttributeValueId: savedValue.id },
      });

      if (multiOptionIds.length > 0) {
        await tx.productAttributeValueOption.createMany({
          data: multiOptionIds.map((id) => ({
            productAttributeValueId: savedValue.id,
            optionId: id,
          })),
          skipDuplicates: true,
        });
      }
    }
  }

  private async resolveRootCategorySlug(
    tx: Prisma.TransactionClient,
    categoryId: string,
  ): Promise<string | null> {
    type CategoryNode = { id: string; parentId: string | null; slug: string };

    const start = await tx.category.findUnique({
      where: { id: categoryId },
      select: { id: true, parentId: true, slug: true },
    });

    if (!start) return null;
    let current: CategoryNode = start;

    const seen = new Set<string>();
    while (current.parentId) {
      if (seen.has(current.id)) return null;
      seen.add(current.id);

      const parent: CategoryNode | null = await tx.category.findUnique({
        where: { id: current.parentId },
        select: { id: true, parentId: true, slug: true },
      });
      if (!parent) return current.slug ?? null;
      current = parent;
    }

    return current.slug ?? null;
  }

  private mapRootSlugToProductTypeCode(rootSlug: string | null): string {
    if (rootSlug === 'ao') return 'ao';
    if (rootSlug === 'quan') return 'quan';
    if (rootSlug === 'vong-tay' || rootSlug === 'vong_tay') return 'vong_tay';
    return 'phu_kien';
  }

  private async resolveProductTypeIdFromCategoryIds(
    tx: Prisma.TransactionClient,
    categoryIds: string[] | undefined,
  ): Promise<string | undefined> {
    if (!categoryIds || categoryIds.length === 0) return undefined;

    const rootSlug = await this.resolveRootCategorySlug(tx, categoryIds[0]);
    const typeCode = this.mapRootSlugToProductTypeCode(rootSlug);

    const direct = await tx.productType.findUnique({
      where: { code: typeCode },
      select: { id: true },
    });
    if (direct) return direct.id;

    const fallback = await tx.productType.findUnique({
      where: { code: 'phu_kien' },
      select: { id: true },
    });

    return fallback?.id;
  }

  private async syncVariantAxisAttributes(
    tx: Prisma.TransactionClient,
    variantId: string,
    attributes: Record<string, any>,
  ): Promise<void> {
    const defs = await tx.attributeDefinition.findMany({
      where: { code: { in: ['color', 'size'] } },
      select: { id: true, code: true },
    });

    const attrIdByCode = new Map(defs.map((d) => [d.code, d.id] as const));

    for (const code of ['color', 'size'] as const) {
      const attributeId = attrIdByCode.get(code);
      if (!attributeId) continue;

      const raw = attributes?.[code];
      const normalized = normalizeOptionValue(raw);

      if (!normalized) {
        await tx.variantAttributeValue.deleteMany({ where: { variantId, attributeId } });
        continue;
      }

      const option = await tx.attributeOption.upsert({
        where: { attributeId_value: { attributeId, value: normalized } },
        update: { label: String(raw).trim() },
        create: { attributeId, value: normalized, label: String(raw).trim() },
        select: { id: true },
      });

      await tx.variantAttributeValue.upsert({
        where: { variantId_attributeId: { variantId, attributeId } },
        update: { optionId: option.id },
        create: { variantId, attributeId, optionId: option.id },
      });
    }
  }

  async save(product: Product): Promise<Product> {
    const data: Prisma.ProductCreateInput = {
      name: product.name,
      basePrice: product.basePrice,
      isDeleted: product.isDeleted,
    };

    const savedProduct = await this.prisma.product.create({
      data,
    });

    return Product.fromPersistence({
      id: savedProduct.id,
      name: savedProduct.name,
      basePrice: Number(savedProduct.basePrice),
      isDeleted: savedProduct.isDeleted,
      createdAt: savedProduct.createdAt,
      updatedAt: savedProduct.updatedAt,
    });
  }

  async saveWithDetails(
    productData: {
      name: string;
      basePrice: number;
    },
    variants: ProductVariant[],
    categoryIds: string[],
    tagIds: string[],
    images: ProductImageProps[],
    productAttributes: ProductAttributeInput[] = [],
  ): Promise<Product> {
    const result = await this.prisma.$transaction(async (tx) => {
      if (categoryIds.length > 0) {
        const existingCategories = await tx.category.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true },
        });

        const existingCategoryIds = existingCategories.map((c) => c.id);
        const notFoundCategoryIds = categoryIds.filter((id) => !existingCategoryIds.includes(id));

        if (notFoundCategoryIds.length > 0) {
          throw new Error(`Categories not found: ${notFoundCategoryIds.join(', ')}`);
        }
      }

      if (tagIds.length > 0) {
        const existingTags = await tx.tag.findMany({
          where: { id: { in: tagIds } },
          select: { id: true },
        });

        const existingTagIds = existingTags.map((t) => t.id);
        const notFoundTagIds = tagIds.filter((id) => !existingTagIds.includes(id));

        if (notFoundTagIds.length > 0) {
          throw new Error(`Tags not found: ${notFoundTagIds.join(', ')}`);
        }
      }

      // 1. Create product
      const productTypeId = await this.resolveProductTypeIdFromCategoryIds(tx, categoryIds);
      const savedProduct = await tx.product.create({
        data: {
          ...(productTypeId ? { productTypeId } : {}),
          name: productData.name,
          basePrice: productData.basePrice,
          isDeleted: false,
        },
      });

      // 2. Create variants
      const variantData = variants.map((v) => ({
        productId: savedProduct.id,
        sku: v.sku,
        attributes: v.attributes,
        optionKey: buildVariantOptionKeyFromAttributes(v.attributes, v.sku),
        price: v.price,
        stockAvailable: v.stockAvailable,
        stockOnHand: v.stockAvailable,
        stockReserved: v.stockReserved,
        minStock: v.minStock,
        isDeleted: v.isDeleted,
      }));

      // Get created variants for image linking
      let createdVariants: Array<{ id: string; sku: string; attributes: unknown }> = [];

      if (variantData.length > 0) {
        await tx.productVariant.createMany({
          data: variantData,
        });

        createdVariants = await tx.productVariant.findMany({
          where: { productId: savedProduct.id },
          select: {
            id: true,
            sku: true,
            attributes: true,
          },
        });
      }

      // Sync legacy JSON attributes -> VariantAttributeValue (color/size)
      for (const cv of createdVariants) {
        await this.syncVariantAxisAttributes(
          tx,
          cv.id,
          (cv.attributes ?? {}) as Record<string, any>,
        );
      }

      // 3. Create images
      const imageData = [];

      // 3a. Ảnh chung của sản phẩm (từ product.images - không có variantId)
      if (images && images.length > 0) {
        const productImages = images.map((img) => ({
          productId: savedProduct.id,
          url: img.url,
          altText: img.altText,
          sortOrder: img.sortOrder ?? 0,
          isPrimary: img.isPrimary ?? true,
        }));
        imageData.push(...productImages);
      }

      // 3b. Ảnh của từng variant (từ variant.images - có variantId)
      const variantImages = variants
        .map((v) =>
          v.images.map((img) => ({
            productId: savedProduct.id,
            variantId: createdVariants.find((cv) => cv.sku === v.sku)?.id || null,
            url: img.url,
            altText: img.altText,
            sortOrder: img.sortOrder ?? 0,
            isPrimary: img.isPrimary ?? false, // Ảnh variant mặc định không phải primary
          })),
        )
        .flat();
      imageData.push(...variantImages);

      if (imageData.length > 0) {
        await tx.productImage.createMany({
          data: imageData,
        });
      }

      // 4. Create product-category relationships (linking existing categories)
      if (categoryIds.length > 0) {
        const categoryLinkData = categoryIds.map((categoryId) => ({
          productId: savedProduct.id,
          categoryId,
        }));

        await tx.productCategory.createMany({
          data: categoryLinkData,
        });
      }

      // 5. Create product-tag relationships (linking existing tags)
      if (tagIds.length > 0) {
        const tagLinkData = tagIds.map((tagId) => ({
          productId: savedProduct.id,
          tagId,
        }));

        await tx.productTag.createMany({
          data: tagLinkData,
        });
      }

      await this.syncProductAttributes(
        tx,
        savedProduct.id,
        savedProduct.productTypeId,
        productAttributes,
      );

      return savedProduct;
    });

    return Product.fromPersistence({
      id: result.id,
      name: result.name,
      basePrice: Number(result.basePrice),
      isDeleted: result.isDeleted,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    });
  }

  async findById(id: string): Promise<Product | null> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return null;
    }

    return Product.fromPersistence({
      id: product.id,
      name: product.name,
      basePrice: Number(product.basePrice),
      isDeleted: product.isDeleted,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    });
  }

  async findByIdWithDetails(id: string): Promise<{
    product: Product;
    variants: ProductVariant[];
    images: any[];
    categories: any[];
    tags: any[];
    productAttributes: Array<{
      code: string;
      name: string;
      dataType: string;
      value: unknown;
      displayValue: string | string[] | null;
    }>;
  } | null> {
    const result = await this.prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          where: { isDeleted: false },
          select: {
            id: true,
            productId: true,
            sku: true,
            attributes: true,
            price: true,
            stockAvailable: true,
            stockReserved: true,
            minStock: true,
            isDeleted: true,
            images: true,
            attributeValues: {
              where: {
                deletedAt: null,
                attribute: { deletedAt: null },
              },
              select: {
                textValue: true,
                attribute: { select: { code: true } },
                option: { select: { value: true, label: true, deletedAt: true } },
              },
            },
          },
        },
        images: true,
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

    if (!result) {
      return null;
    }

    const product = Product.fromPersistence({
      id: result.id,
      name: result.name,
      basePrice: Number(result.basePrice),
      isDeleted: result.isDeleted,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    });

    const mergeAttributes = (variant: any): Record<string, any> => {
      const merged: Record<string, any> = {
        ...(variant?.attributes && typeof variant.attributes === 'object'
          ? variant.attributes
          : {}),
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

      return merged;
    };

    const variants = result.variants.map((v) =>
      ProductVariant.fromPersistence({
        id: v.id,
        productId: v.productId,
        sku: v.sku,
        attributes: mergeAttributes(v),
        price: Number(v.price),
        stockAvailable: v.stockAvailable,
        stockReserved: v.stockReserved,
        minStock: v.minStock,
        isDeleted: v.isDeleted,
        images: v.images.map((img) => ({
          id: img.id,
          productId: img.productId,
          variantId: img.variantId ?? undefined,
          url: img.url,
          altText: img.altText ?? undefined,
          sortOrder: img.sortOrder,
          isPrimary: img.isPrimary,
        })),
      }),
    );

    return {
      product,
      variants,
      images: result.images,
      categories: result.categories.map((c) => c.category),
      tags: result.tags.map((t) => t.tag),
      productAttributes: this.mapProductAttributeDetails(result.attributeValues),
    };
  }

  async existsBySku(sku: string): Promise<boolean> {
    const variant = await this.prisma.productVariant.findFirst({
      where: { sku },
      select: { id: true },
    });
    return variant !== null;
  }

  async update(product: Product): Promise<Product> {
    if (!product.id) {
      throw new Error('Product id is required for update');
    }

    const updated = await this.prisma.product.update({
      where: { id: product.id },
      data: {
        name: product.name,
        basePrice: product.basePrice,
        isDeleted: product.isDeleted,
      },
    });

    return Product.fromPersistence({
      id: updated.id,
      name: updated.name,
      basePrice: Number(updated.basePrice),
      isDeleted: updated.isDeleted,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    });
  }

  async findManyWithFilters(command: any): Promise<{
    items: any[];
    total: number;
    aggregations: any;
  }> {
    const where: any = {};

    // Status filter
    if (command.status === 'active') {
      where.isDeleted = false;
    } else if (command.status === 'inactive' || command.status === 'deleted') {
      where.isDeleted = true;
    }

    // Search filter (fulltext search on name)
    if (command.search) {
      where.OR = [
        { name: { contains: command.search } },
        {
          variants: {
            some: {
              sku: { contains: command.search },
            },
          },
        },
        {
          tags: {
            some: {
              tag: {
                name: { contains: command.search },
              },
            },
          },
        },
      ];
    }

    // Category filter
    if (command.categoryId) {
      where.categories = {
        some: { categoryId: command.categoryId },
      };
    }

    // Price filter
    if (command.minPrice !== undefined || command.maxPrice !== undefined) {
      where.basePrice = {};
      if (command.minPrice !== undefined) {
        where.basePrice.gte = command.minPrice;
      }
      if (command.maxPrice !== undefined) {
        where.basePrice.lte = command.maxPrice;
      }
    }

    // Tag filter
    if (command.tagIds) {
      const tagIdArray = command.tagIds.split(',');
      where.tags = {
        some: {
          tagId: { in: tagIdArray },
        },
      };
    }

    // Get total count
    const total = await this.prisma.product.count({ where });

    // Get aggregations
    const [activeCount, inactiveCount, deletedCount] = await Promise.all([
      this.prisma.product.count({ where: { isDeleted: false } }),
      this.prisma.product.count({ where: { isDeleted: true } }),
      this.prisma.product.count({ where: { isDeleted: true } }),
    ]);

    // Sorting
    const orderBy: any = {};
    if (command.sortBy === 'name') {
      orderBy.name = command.sortOrder;
    } else if (command.sortBy === 'basePrice') {
      orderBy.basePrice = command.sortOrder;
    } else if (command.sortBy === 'createdAt') {
      orderBy.createdAt = command.sortOrder;
    }

    // Pagination
    const skip = (command.page - 1) * command.limit;
    const take = command.limit;

    // Fetch products with relations
    const products = await this.prisma.product.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        variants: {
          where: { isDeleted: false },
          select: {
            id: true,
            productId: true,
            sku: true,
            attributes: true,
            price: true,
            stockAvailable: true,
            stockReserved: true,
            minStock: true,
            isDeleted: true,
            images: true,
          },
        },
        images: {
          where: { isPrimary: true, variantId: null },
          take: 1,
        },
        categories: {
          include: { category: true },
          take: 3,
        },
        tags: {
          include: { tag: true },
          take: 5,
        },
      },
    });

    // Map to DTOs
    const items = products.map((p) => {
      const primaryImage = p.images[0];
      const totalStock = p.variants.reduce((sum, v) => sum + v.stockAvailable, 0);
      const lowStockCount = p.variants.filter((v) => v.stockAvailable < v.minStock).length;
      const prices = p.variants.map((v) => Number(v.price));

      return {
        id: p.id,
        name: p.name,
        basePrice: Number(p.basePrice),
        status: p.isDeleted ? 'deleted' : 'active',
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        primaryImage: primaryImage
          ? {
              id: primaryImage.id,
              url: primaryImage.url,
              altText: primaryImage.altText,
            }
          : undefined,
        variantsSummary: {
          count: p.variants.length,
          firstSku: p.variants[0]?.sku,
          priceRange: {
            min: prices.length > 0 ? Math.min(...prices) : 0,
            max: prices.length > 0 ? Math.max(...prices) : 0,
          },
          totalStock,
          lowStockCount,
        },
        categories: p.categories.map((pc) => ({
          id: pc.category.id,
          name: pc.category.name,
          slug: pc.category.slug,
        })),
        tags: p.tags.map((pt) => ({
          id: pt.tag.id,
          name: pt.tag.name,
          slug: pt.tag.slug,
        })),
      };
    });

    return {
      items,
      total,
      aggregations: {
        statusCount: {
          active: activeCount,
          inactive: inactiveCount,
          deleted: deletedCount,
        },
        stockStatus: {
          all: total,
          low: 0, // TODO: Calculate
          out: 0, // TODO: Calculate
        },
      },
    };
  }

  async updateWithDetails(
    productId: string,
    productData: any,
    variants?: ProductVariant[],
    categoryIds?: string[],
    tagIds?: string[],
    images?: ProductImageProps[],
    productAttributes?: ProductAttributeInput[],
  ): Promise<Product> {
    const result = await this.prisma.$transaction(async (tx) => {
      const nextProductData = { ...productData };

      if (categoryIds !== undefined && nextProductData.productTypeId === undefined) {
        const productTypeId = await this.resolveProductTypeIdFromCategoryIds(tx, categoryIds);
        if (productTypeId) {
          nextProductData.productTypeId = productTypeId;
        }
      }

      // Update product
      const updated = await tx.product.update({
        where: { id: productId },
        data: nextProductData,
      });

      // Update categories if provided
      if (categoryIds !== undefined) {
        // Delete existing
        await tx.productCategory.deleteMany({
          where: { productId },
        });
        // Create new
        if (categoryIds.length > 0) {
          await tx.productCategory.createMany({
            data: categoryIds.map((categoryId) => ({
              productId,
              categoryId,
            })),
          });
        }
      }

      // Update tags if provided
      if (tagIds !== undefined) {
        await tx.productTag.deleteMany({
          where: { productId },
        });
        if (tagIds.length > 0) {
          await tx.productTag.createMany({
            data: tagIds.map((tagId) => ({
              productId,
              tagId,
            })),
          });
        }
      }

      // Update variants if provided
      if (variants) {
        // Get existing variants
        const existingVariants = await tx.productVariant.findMany({
          where: { productId },
          select: { id: true },
        });

        const variantIdsToKeep = variants.filter((v) => v.id).map((v) => v.id!);

        // Soft delete variants not in the list
        const variantsToDelete = existingVariants.filter((ev) => !variantIdsToKeep.includes(ev.id));
        for (const variant of variantsToDelete) {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: { isDeleted: true },
          });
        }

        // Detach images from removed variants so the product can have no variants
        if (variantsToDelete.length > 0) {
          await tx.productImage.updateMany({
            where: {
              productId,
              variantId: { in: variantsToDelete.map((v) => v.id) },
            },
            data: { variantId: null },
          });

          const hasPrimaryProductImage = await tx.productImage.findFirst({
            where: { productId, variantId: null, isPrimary: true },
            select: { id: true },
          });

          if (!hasPrimaryProductImage) {
            const candidate = await tx.productImage.findFirst({
              where: { productId, variantId: null },
              orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
              select: { id: true },
            });

            if (candidate) {
              await tx.productImage.update({
                where: { id: candidate.id },
                data: { isPrimary: true },
              });
            }
          }
        }

        // Update or create variants
        for (const variant of variants) {
          if (variant.id) {
            // Update existing
            const updatedVariant = await tx.productVariant.update({
              where: { id: variant.id },
              data: {
                sku: variant.sku,
                attributes: variant.attributes,
                optionKey: buildVariantOptionKeyFromAttributes(variant.attributes, variant.sku),
                price: variant.price,
                stockAvailable: variant.stockAvailable,
                stockOnHand: variant.stockAvailable,
                minStock: variant.minStock,
              },
            });

            await this.syncVariantAxisAttributes(
              tx,
              updatedVariant.id,
              (variant.attributes ?? {}) as Record<string, any>,
            );
          } else {
            // Create new
            const createdVariant = await tx.productVariant.create({
              data: {
                productId,
                sku: variant.sku,
                attributes: variant.attributes,
                optionKey: buildVariantOptionKeyFromAttributes(variant.attributes, variant.sku),
                price: variant.price,
                stockAvailable: variant.stockAvailable,
                stockOnHand: variant.stockAvailable,
                stockReserved: variant.stockReserved,
                minStock: variant.minStock,
                isDeleted: false,
              },
            });

            await this.syncVariantAxisAttributes(
              tx,
              createdVariant.id,
              (variant.attributes ?? {}) as Record<string, any>,
            );
          }
        }
      }

      // Update images if provided
      if (images) {
        // Delete existing images
        await tx.productImage.deleteMany({
          where: { productId, variantId: null },
        });
        // Create new
        if (images.length > 0) {
          await tx.productImage.createMany({
            data: images.map((img) => ({
              productId,
              variantId: img.variantId || null,
              url: img.url,
              altText: img.altText,
              sortOrder: img.sortOrder || 0,
              isPrimary: img.isPrimary || false,
            })),
          });
        }
      }

      if (productAttributes !== undefined) {
        await this.syncProductAttributes(tx, productId, updated.productTypeId, productAttributes);
      }

      return updated;
    });

    return Product.fromPersistence({
      id: result.id,
      name: result.name,
      basePrice: Number(result.basePrice),
      isDeleted: result.isDeleted,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    });
  }

  async softDelete(productId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Soft delete product
      await tx.product.update({
        where: { id: productId },
        data: { isDeleted: true },
      });

      // Soft delete all variants
      await tx.productVariant.updateMany({
        where: { productId },
        data: { isDeleted: true },
      });
    });
  }

  async restore(productId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Restore product
      await tx.product.update({
        where: { id: productId },
        data: { isDeleted: false },
      });

      // Restore all variants
      await tx.productVariant.updateMany({
        where: { productId },
        data: { isDeleted: false },
      });
    });
  }

  async bulkSoftDelete(
    productIds: string[],
  ): Promise<{ successCount: number; failedIds: string[] }> {
    const failedIds: string[] = [];
    let successCount = 0;

    for (const productId of productIds) {
      try {
        await this.softDelete(productId);
        successCount++;
      } catch (error) {
        failedIds.push(productId);
      }
    }

    return { successCount, failedIds };
  }

  async bulkAssignCategories(
    productIds: string[],
    categoryIds: string[],
    mode: 'append' | 'replace',
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const productId of productIds) {
        if (mode === 'replace') {
          // Delete existing
          await tx.productCategory.deleteMany({
            where: { productId },
          });
        }

        // Create new (skip duplicates for append mode)
        for (const categoryId of categoryIds) {
          await tx.productCategory.upsert({
            where: {
              productId_categoryId: {
                productId,
                categoryId,
              },
            },
            create: { productId, categoryId },
            update: {},
          });
        }
      }
    });
  }

  async bulkAssignTags(
    productIds: string[],
    tagIds: string[],
    mode: 'append' | 'replace',
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const productId of productIds) {
        if (mode === 'replace') {
          await tx.productTag.deleteMany({
            where: { productId },
          });
        }

        for (const tagId of tagIds) {
          await tx.productTag.upsert({
            where: {
              productId_tagId: {
                productId,
                tagId,
              },
            },
            create: { productId, tagId },
            update: {},
          });
        }
      }
    });
  }
}
