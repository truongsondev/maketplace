import {
  Product,
  ProductVariant,
  ProductImageProps,
} from '../../../entities/product/product.entity';
import { GetProductsListCommand } from '../../dto';

export interface IProductRepository {
  save(product: Product): Promise<Product>;

  saveWithDetails(
    product: Product,
    variants: ProductVariant[],
    categoryIds: string[],
    tagIds: string[],
    images: ProductImageProps[],
  ): Promise<Product>;

  findById(id: string): Promise<Product | null>;

  findByIdWithDetails(id: string): Promise<{
    product: Product;
    variants: ProductVariant[];
    images: any[];
    categories: any[];
    tags: any[];
  } | null>;

  findManyWithFilters(command: GetProductsListCommand): Promise<{
    items: any[];
    total: number;
    aggregations: any;
  }>;

  existsBySku(sku: string): Promise<boolean>;

  update(product: Product): Promise<Product>;

  updateWithDetails(
    productId: string,
    productData: {
      name?: string;
      description?: string;
      basePrice?: number;
      isDeleted?: boolean;
    },
    variants?: ProductVariant[],
    categoryIds?: string[],
    tagIds?: string[],
    images?: ProductImageProps[],
  ): Promise<Product>;

  softDelete(productId: string): Promise<void>;

  restore(productId: string): Promise<void>;

  bulkSoftDelete(productIds: string[]): Promise<{ successCount: number; failedIds: string[] }>;

  bulkAssignCategories(
    productIds: string[],
    categoryIds: string[],
    mode: 'append' | 'replace',
  ): Promise<void>;

  bulkAssignTags(productIds: string[], tagIds: string[], mode: 'append' | 'replace'): Promise<void>;
}
