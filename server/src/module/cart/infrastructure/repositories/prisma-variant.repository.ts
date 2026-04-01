import { PrismaClient } from '@/generated/prisma/client';
import {
  IVariantRepository,
  VariantWithProduct,
} from '../../applications/ports/output/variant.repository';

export class PrismaVariantRepository implements IVariantRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByIdWithProduct(variantId: string): Promise<VariantWithProduct | null> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      select: {
        id: true,
        sku: true,
        attributes: true,
        price: true,
        stockAvailable: true,
        stockReserved: true,
        isDeleted: true,
        product: {
          select: {
            id: true,
            name: true,
            isDeleted: true,
          },
        },
      },
    });

    if (!variant) return null;

    return {
      ...variant,
      attributes: variant.attributes as any,
      price: Number(variant.price),
    };
  }

  async reserveStock(variantId: string, quantity: number): Promise<void> {
    await this.prisma.productVariant.update({
      where: { id: variantId },
      data: {
        stockReserved: {
          increment: quantity,
        },
      },
    });
  }

  async releaseStock(variantId: string, quantity: number): Promise<void> {
    await this.prisma.productVariant.update({
      where: { id: variantId },
      data: {
        stockReserved: {
          decrement: quantity,
        },
      },
    });
  }
}
