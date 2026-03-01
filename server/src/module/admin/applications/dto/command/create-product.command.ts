export interface CreateProductCommand {
  name: string;
  description?: string;
  basePrice: number;
  variants: CreateProductVariantDto[];
  images?: CreateProductImageDto[];
  categoryIds?: string[];
  tagIds?: string[];
}

export interface CreateProductVariantDto {
  sku: string;
  attributes: Record<string, any>;
  price: number;
  stockAvailable: number;
  minStock?: number;
}

export interface CreateProductImageDto {
  url: string;
  altText?: string;
  sortOrder?: number;
  isPrimary?: boolean;
  variantId?: string;
}

export interface CreateProductResult {
  productId: string;
  message: string;
}
