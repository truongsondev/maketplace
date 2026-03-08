import {
  Product,
  ProductVariant,
  ProductImageProps,
} from '../../../entities/product/product.entity';

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

  existsBySku(sku: string): Promise<boolean>;

  update(product: Product): Promise<Product>;
}
