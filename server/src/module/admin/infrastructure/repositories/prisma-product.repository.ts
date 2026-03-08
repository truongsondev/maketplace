import { PrismaClient, Prisma } from '../../../../../generated/prisma/client';
import { Product, ProductVariant, ProductImageProps } from '../../entities/product/product.entity';
import { IProductRepository } from '../../applications/ports/output/product.repository';

export class PrismaProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(product: Product): Promise<Product> {
    const data: Prisma.ProductCreateInput = {
      name: product.name,
      description: product.description,
      basePrice: product.basePrice,
      isDeleted: product.isDeleted,
    };

    const savedProduct = await this.prisma.product.create({
      data,
    });

    return Product.fromPersistence({
      id: savedProduct.id,
      name: savedProduct.name,
      description: savedProduct.description ?? undefined,
      basePrice: Number(savedProduct.basePrice),
      isDeleted: savedProduct.isDeleted,
      createdAt: savedProduct.createdAt,
      updatedAt: savedProduct.updatedAt,
    });
  }

  async saveWithDetails(
    productData: {
      name: string;
      description?: string;
      basePrice: number;
    },
    variants: ProductVariant[],
    categoryIds: string[],
    tagIds: string[],
    images: ProductImageProps[],
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
      const savedProduct = await tx.product.create({
        data: {
          name: productData.name,
          description: productData.description,
          basePrice: productData.basePrice,
          isDeleted: false,
        },
      });

      // 2. Create variants
      const variantData = variants.map((v) => ({
        productId: savedProduct.id,
        sku: v.sku,
        attributes: v.attributes,
        price: v.price,
        stockAvailable: v.stockAvailable,
        stockReserved: v.stockReserved,
        minStock: v.minStock,
        isDeleted: v.isDeleted,
      }));

      const savedVariants = await tx.productVariant.createMany({
        data: variantData,
      });

      // Get created variants for image linking
      const createdVariants = await tx.productVariant.findMany({
        where: { productId: savedProduct.id },
      });

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

      return savedProduct;
    });

    return Product.fromPersistence({
      id: result.id,
      name: result.name,
      description: result.description ?? undefined,
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
      description: product.description ?? undefined,
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
  } | null> {
    const result = await this.prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          include: {
            images: true,
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
      },
    });

    if (!result) {
      return null;
    }

    const product = Product.fromPersistence({
      id: result.id,
      name: result.name,
      description: result.description ?? undefined,
      basePrice: Number(result.basePrice),
      isDeleted: result.isDeleted,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    });

    const variants = result.variants.map((v) =>
      ProductVariant.fromPersistence({
        id: v.id,
        productId: v.productId,
        sku: v.sku,
        attributes: v.attributes as Record<string, any>,
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
    };
  }

  async existsBySku(sku: string): Promise<boolean> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { sku },
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
        description: product.description,
        basePrice: product.basePrice,
        isDeleted: product.isDeleted,
      },
    });

    return Product.fromPersistence({
      id: updated.id,
      name: updated.name,
      description: updated.description ?? undefined,
      basePrice: Number(updated.basePrice),
      isDeleted: updated.isDeleted,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    });
  }
}
