export interface CreateProductCommand {
  name: string;
  description?: string;
  basePrice: number;
  variants: CreateProductVariantDto[];
  categoryIds?: string[];
  tagIds?: string[];
  images: CreateProductImageDto[];
}

export interface CreateProductVariantDto {
  sku: string;
  attributes: Record<string, any>;
  price: number;
  stockAvailable: number;
  minStock?: number;
  images: CreateProductImageDto[];
}

export interface CreateProductImageDto {
  url: string;
  altText?: string;
  sortOrder?: number;
  isPrimary?: boolean;
}

export interface CreateProductResult {
  productId: string;
  message: string;
}
