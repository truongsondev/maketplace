export interface UpdateProductCommand {
  productId: string;
  name?: string;
  basePrice?: number;
  status?: 'active' | 'inactive';
  categoryIds?: string[];
  tagIds?: string[];
  variants?: UpdateProductVariantDto[];
  images?: UpdateProductImageDto[];
  productAttributes?: UpdateProductAttributeInputDto[];
}

export interface UpdateProductAttributeInputDto {
  code: string;
  value: unknown;
}

export interface UpdateProductVariantDto {
  id?: string; // Có id = update, không có id = create
  sku: string;
  attributes: Record<string, any>;
  price: number;
  stockAvailable: number;
  minStock?: number;
  images?: UpdateProductImageDto[];
}

export interface UpdateProductImageDto {
  id?: string; // Có id = update, không có id = create
  url: string;
  altText?: string;
  sortOrder?: number;
  isPrimary?: boolean;
  variantId?: string;
}

export interface UpdateProductResult {
  productId: string;
  message: string;
  priceChanged: boolean;
}
