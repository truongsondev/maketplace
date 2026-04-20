import {
  Product,
  ProductVariant,
  ProductImageProps,
} from '../../../entities/product/product.entity';
import { GetProductsListCommand } from '../../dto';

export interface ProductAttributeInput {
  code: string;
  value: unknown;
}

export interface ProductAttributeDetail {
  code: string;
  name: string;
  dataType: string;
  value: unknown;
  displayValue: string | string[] | null;
}

export interface IProductRepository {
  save(product: Product): Promise<Product>;

  saveWithDetails(
    product: {
      name: string;
      basePrice: number;
    },
    variants: ProductVariant[],
    categoryIds: string[],
    tagIds: string[],
    images: ProductImageProps[],
    productAttributes?: ProductAttributeInput[],
  ): Promise<Product>;

  findById(id: string): Promise<Product | null>;

  findByIdWithDetails(id: string): Promise<{
    product: Product;
    variants: ProductVariant[];
    images: any[];
    categories: any[];
    tags: any[];
    productAttributes: ProductAttributeDetail[];
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
      basePrice?: number;
      isDeleted?: boolean;
    },
    variants?: ProductVariant[],
    categoryIds?: string[],
    tagIds?: string[],
    images?: ProductImageProps[],
    productAttributes?: ProductAttributeInput[],
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
