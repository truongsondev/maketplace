import { PrismaClient } from '../../../../../../generated/prisma/client';
import { IPriceHistoryRepository } from '../../applications/ports/output';

export class PrismaPriceHistoryRepository implements IPriceHistoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: {
    productId: string;
    variantId?: string;
    oldPrice: number;
    newPrice: number;
    changedBy?: string;
  }): Promise<void> {
    await this.prisma.productPriceHistory.create({
      data: {
        productId: data.productId,
        variantId: data.variantId,
        oldPrice: data.oldPrice,
        newPrice: data.newPrice,
        changedBy: data.changedBy,
      },
    });
  }

  async findByProductId(productId: string, variantId?: string): Promise<any[]> {
    const where: any = { productId };
    if (variantId) {
      where.variantId = variantId;
    }

    return await this.prisma.productPriceHistory.findMany({
      where,
      orderBy: { changedAt: 'desc' },
      include: {
        variant: {
          select: { sku: true },
        },
      },
    });
  }
}
