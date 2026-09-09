import { PrismaClient } from '@/generated/prisma/client';
import {
  IProductImageRepository,
  ProductImageData,
} from '../../applications/ports/output/product-image.repository';

export class PrismaProductImageRepository implements IProductImageRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findImageForVariant(
    variantId: string,
    productId: string,
  ): Promise<ProductImageData | null> {
    // First, try to get variant-specific image
    const variantImage = await this.prisma.productImage.findFirst({
      where: {
        variantId,
      },
      orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
      select: {
        url: true,
        altText: true,
        isPrimary: true,
      },
    });

    if (variantImage) {
      return variantImage;
    }

    // Fallback: Get product-level image (variantId = null)
    const productImage = await this.prisma.productImage.findFirst({
      where: {
        productId,
        variantId: null,
      },
      orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
      select: {
        url: true,
        altText: true,
        isPrimary: true,
      },
    });

    return productImage;
  }
}
