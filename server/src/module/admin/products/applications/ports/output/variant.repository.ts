import { ProductVariant } from '../../../entities/product/product.entity';

export interface IVariantRepository {
  findById(variantId: string): Promise<ProductVariant | null>;

  findByProductId(productId: string): Promise<ProductVariant[]>;

  create(productId: string, variant: ProductVariant): Promise<ProductVariant>;

  update(variantId: string, data: Partial<ProductVariant>): Promise<ProductVariant>;

  softDelete(variantId: string): Promise<void>;

  countActiveByProductId(productId: string): Promise<number>;

  existsBySku(sku: string): Promise<boolean>;

  adjustStock(
    variantId: string,
    action: 'IMPORT' | 'EXPORT' | 'ADJUSTMENT',
    quantity: number,
    referenceId?: string,
  ): Promise<{
    oldStock: number;
    newStock: number;
    logId: string;
  }>;
}
