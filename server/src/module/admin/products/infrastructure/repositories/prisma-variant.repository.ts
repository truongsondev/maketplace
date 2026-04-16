import { PrismaClient, Prisma } from '../../../../../../generated/prisma/client';
import { ProductVariant, ProductImageProps } from '../../entities/product/product.entity';
import { IVariantRepository } from '../../applications/ports/output';
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

export class PrismaVariantRepository implements IVariantRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private async syncVariantAxisAttributes(
    variantId: string,
    attributes: Record<string, any>,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = tx ?? this.prisma;

    const defs = await prisma.attributeDefinition.findMany({
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
        await prisma.variantAttributeValue.deleteMany({
          where: { variantId, attributeId },
        });
        continue;
      }

      const option = await prisma.attributeOption.upsert({
        where: { attributeId_value: { attributeId, value: normalized } },
        update: { label: String(raw).trim() },
        create: { attributeId, value: normalized, label: String(raw).trim() },
        select: { id: true },
      });

      await prisma.variantAttributeValue.upsert({
        where: { variantId_attributeId: { variantId, attributeId } },
        update: { optionId: option.id },
        create: { variantId, attributeId, optionId: option.id },
      });
    }
  }

  async findById(variantId: string): Promise<ProductVariant | null> {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId },
      select: {
        id: true,
        productId: true,
        sku: true,
        attributes: true,
        price: true,
        stockAvailable: true,
        stockOnHand: true,
        stockReserved: true,
        minStock: true,
        isDeleted: true,
        images: true,
      },
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
      select: {
        id: true,
        productId: true,
        sku: true,
        attributes: true,
        price: true,
        stockAvailable: true,
        stockOnHand: true,
        stockReserved: true,
        minStock: true,
        isDeleted: true,
        images: true,
      },
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
    const optionKey = buildVariantOptionKeyFromAttributes(variant.attributes, variant.sku);
    const created = await this.prisma.$transaction(async (tx) => {
      const v = await tx.productVariant.create({
        data: {
          productId,
          sku: variant.sku,
          attributes: variant.attributes,
          optionKey,
          price: variant.price,
          stockAvailable: variant.stockAvailable,
          stockOnHand: variant.stockAvailable,
          stockReserved: variant.stockReserved,
          minStock: variant.minStock,
          isDeleted: false,
        },
      });

      await this.syncVariantAxisAttributes(
        v.id,
        (variant.attributes ?? {}) as Record<string, any>,
        tx,
      );
      return v;
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
    if (data.stockAvailable !== undefined) {
      updateData.stockAvailable = data.stockAvailable;
      updateData.stockOnHand = data.stockAvailable;
    }
    if (data.minStock !== undefined) updateData.minStock = data.minStock;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (data.attributes !== undefined || data.sku !== undefined) {
        const current = await tx.productVariant.findUnique({
          where: { id: variantId },
          select: { sku: true, attributes: true },
        });

        if (!current) {
          throw new Error(`Variant not found: ${variantId}`);
        }

        const nextSku = (data.sku ?? current.sku) as string;
        const nextAttrs = (data.attributes ??
          (current.attributes as Record<string, any>)) as unknown;
        updateData.optionKey = buildVariantOptionKeyFromAttributes(nextAttrs, nextSku);
      }

      const v = await tx.productVariant.update({
        where: { id: variantId },
        data: updateData,
      });

      if (data.attributes !== undefined) {
        await this.syncVariantAxisAttributes(
          v.id,
          (data.attributes ?? {}) as Record<string, any>,
          tx,
        );
      }

      return v;
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
    const variant = await this.prisma.productVariant.findFirst({
      where: { sku },
      select: { id: true },
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
      const variant = await tx.productVariant.findFirst({
        where: { id: variantId },
        select: { stockAvailable: true, stockOnHand: true },
      });

      if (!variant) {
        throw new Error('Variant not found');
      }

      const oldStock = variant.stockOnHand;
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
        data: { stockAvailable: newStock, stockOnHand: newStock },
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
