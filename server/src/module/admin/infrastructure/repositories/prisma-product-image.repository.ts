import { PrismaClient } from '@/generated/prisma/client';
import {
  IProductImageRepository,
  ProductImageData,
  ProductImageEntity,
} from '../../applications/ports/output/product-image.repository';

export class PrismaProductImageRepository implements IProductImageRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(data: ProductImageData): Promise<ProductImageEntity> {
    const image = await this.prisma.productImage.create({
      data: {
        productId: data.productId,
        variantId: data.variantId,
        url: data.url,
        altText: data.altText,
        sortOrder: data.sortOrder,
        isPrimary: data.isPrimary,
      },
    });

    return {
      id: image.id,
      productId: image.productId,
      variantId: image.variantId,
      url: image.url,
      altText: image.altText,
      sortOrder: image.sortOrder,
      isPrimary: image.isPrimary,
      createdAt: image.createdAt,
    };
  }

  async findById(id: string): Promise<ProductImageEntity | null> {
    const image = await this.prisma.productImage.findUnique({
      where: { id },
    });

    if (!image) return null;

    return {
      id: image.id,
      productId: image.productId,
      variantId: image.variantId,
      url: image.url,
      altText: image.altText,
      sortOrder: image.sortOrder,
      isPrimary: image.isPrimary,
      createdAt: image.createdAt,
    };
  }

  async findByProductId(productId: string): Promise<ProductImageEntity[]> {
    const images = await this.prisma.productImage.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' },
    });

    return images.map((image) => ({
      id: image.id,
      productId: image.productId,
      variantId: image.variantId,
      url: image.url,
      altText: image.altText,
      sortOrder: image.sortOrder,
      isPrimary: image.isPrimary,
      createdAt: image.createdAt,
    }));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.productImage.delete({
      where: { id },
    });
  }

  async updatePrimaryStatus(productId: string, imageId: string): Promise<void> {
    await this.prisma.productImage.updateMany({
      where: { productId, id: imageId },
      data: { isPrimary: false },
    });
  }
}
