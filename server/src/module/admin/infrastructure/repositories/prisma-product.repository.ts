import { PrismaClient, Prisma } from '../../../../../generated/prisma/client';
import { Product, ProductVariant } from '../../entities/product/product.entity';
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
    product: Product,
    variants: ProductVariant[],
    images: Array<{
      url: string;
      altText?: string;
      sortOrder?: number;
      isPrimary?: boolean;
      variantId?: string;
    }>,
    categoryIds: string[],
    tagIds: string[],
  ): Promise<Product> {
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create product
      const savedProduct = await tx.product.create({
        data: {
          name: product.name,
          description: product.description,
          basePrice: product.basePrice,
          isDeleted: product.isDeleted,
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
      if (images.length > 0) {
        const imageData = images.map((img) => {
          // Find variant by SKU if variantId is provided (assuming variantId is SKU for now)
          let variantId = null;
          if (img.variantId) {
            const variant = createdVariants.find((v) => v.sku === img.variantId);
            variantId = variant?.id || null;
          }

          return {
            productId: savedProduct.id,
            variantId,
            url: img.url,
            altText: img.altText,
            sortOrder: img.sortOrder ?? 0,
            isPrimary: img.isPrimary ?? false,
          };
        });

        await tx.productImage.createMany({
          data: imageData,
        });
      }

      // 4. Link categories
      if (categoryIds.length > 0) {
        const categoryData = categoryIds.map((categoryId) => ({
          productId: savedProduct.id,
          categoryId,
        }));

        await tx.productCategory.createMany({
          data: categoryData,
        });
      }

      // 5. Link tags
      if (tagIds.length > 0) {
        const tagData = tagIds.map((tagId) => ({
          productId: savedProduct.id,
          tagId,
        }));

        await tx.productTag.createMany({
          data: tagData,
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
        variants: true,
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
