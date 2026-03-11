import { PrismaClient } from '../../../../../../generated/prisma/client';
import { ProductVariant, ProductImageProps } from '../../entities/product/product.entity';
import { IVariantRepository } from '../../applications/ports/output';

export class PrismaVariantRepository implements IVariantRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(variantId: string): Promise<ProductVariant | null> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { images: true },
    });

    if (!variant) return null;

    return ProductVariant.fromPersistence({
      id: variant.id,
      productId: variant.productId,
      sku: variant.sku,
      attributes: variant.attributes as Record<string, any>,
      price: Number(variant.price),
      stockAvailable: variant.stockAvailable,
      stockReserved: variant.stockReserved,
      minStock: variant.minStock,
      isDeleted: variant.isDeleted,
      images: variant.images.map((img) => ({
        id: img.id,
        productId: img.productId,
        variantId: img.variantId ?? undefined,
        url: img.url,
        altText: img.altText ?? undefined,
        sortOrder: img.sortOrder,
        isPrimary: img.isPrimary,
      })),
    });
  }

  async findByProductId(productId: string): Promise<ProductVariant[]> {
    const variants = await this.prisma.productVariant.findMany({
      where: { productId, isDeleted: false },
      include: { images: true },
    });

    return variants.map((v) =>
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
  }

  async create(productId: string, variant: ProductVariant): Promise<ProductVariant> {
    const created = await this.prisma.productVariant.create({
      data: {
        productId,
        sku: variant.sku,
        attributes: variant.attributes,
        price: variant.price,
        stockAvailable: variant.stockAvailable,
        stockReserved: variant.stockReserved,
        minStock: variant.minStock,
        isDeleted: false,
      },
    });

    return ProductVariant.fromPersistence({
      id: created.id,
      productId: created.productId,
      sku: created.sku,
      attributes: created.attributes as Record<string, any>,
      price: Number(created.price),
      stockAvailable: created.stockAvailable,
      stockReserved: created.stockReserved,
      minStock: created.minStock,
      isDeleted: created.isDeleted,
      images: [],
    });
  }

  async update(variantId: string, data: Partial<ProductVariant>): Promise<ProductVariant> {
    const updateData: any = {};
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.attributes !== undefined) updateData.attributes = data.attributes;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.stockAvailable !== undefined) updateData.stockAvailable = data.stockAvailable;
    if (data.minStock !== undefined) updateData.minStock = data.minStock;

    const updated = await this.prisma.productVariant.update({
      where: { id: variantId },
      data: updateData,
    });

    return ProductVariant.fromPersistence({
      id: updated.id,
      productId: updated.productId,
      sku: updated.sku,
      attributes: updated.attributes as Record<string, any>,
      price: Number(updated.price),
      stockAvailable: updated.stockAvailable,
      stockReserved: updated.stockReserved,
      minStock: updated.minStock,
      isDeleted: updated.isDeleted,
      images: [],
    });
  }

  async softDelete(variantId: string): Promise<void> {
    await this.prisma.productVariant.update({
      where: { id: variantId },
      data: { isDeleted: true },
    });
  }

  async countActiveByProductId(productId: string): Promise<number> {
    return await this.prisma.productVariant.count({
      where: { productId, isDeleted: false },
    });
  }

  async existsBySku(sku: string): Promise<boolean> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { sku },
    });
    return variant !== null;
  }

  async adjustStock(
    variantId: string,
    action: 'IMPORT' | 'EXPORT' | 'ADJUSTMENT',
    quantity: number,
    referenceId?: string,
  ): Promise<{
    oldStock: number;
    newStock: number;
    logId: string;
  }> {
    return await this.prisma.$transaction(async (tx) => {
      // Get current stock
      const variant = await tx.productVariant.findUnique({
        where: { id: variantId },
        select: { stockAvailable: true },
      });

      if (!variant) {
        throw new Error('Variant not found');
      }

      const oldStock = variant.stockAvailable;
      let newStock = oldStock;

      // Calculate new stock based on action
      if (action === 'IMPORT') {
        newStock = oldStock + quantity;
      } else if (action === 'EXPORT') {
        newStock = oldStock - quantity;
      } else if (action === 'ADJUSTMENT') {
        newStock = oldStock + quantity; // quantity can be positive or negative
      }

      // Update stock
      await tx.productVariant.update({
        where: { id: variantId },
        data: { stockAvailable: newStock },
      });

      // Create inventory log
      const log = await tx.inventoryLog.create({
        data: {
          variantId,
          action,
          quantity,
          referenceId,
        },
      });

      return {
        oldStock,
        newStock,
        logId: log.id,
      };
    });
  }
}
