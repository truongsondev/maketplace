export interface GetProductDetailCommand {
  productId: string;
}

export interface GetProductDetailResult {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  variants: ProductVariantDetailDto[];
  images: ProductImageDetailDto[];
  categories: CategoryDetailDto[];
  tags: TagDetailDto[];
  stats: ProductStatsDto;
}

export interface ProductVariantDetailDto {
  id: string;
  sku: string;
  attributes: Record<string, any>;
  price: number;
  stockAvailable: number;
  stockReserved: number;
  minStock: number;
  status: string;
  createdAt: Date;
  images: ProductImageDetailDto[];
}

export interface ProductImageDetailDto {
  id: string;
  url: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
  variantId?: string;
}

export interface CategoryDetailDto {
  id: string;
  name: string;
  slug: string;
}

export interface TagDetailDto {
  id: string;
  name: string;
  slug: string;
}

export interface ProductStatsDto {
  totalVariants: number;
  totalStock: number;
  lowStockVariants: number;
  totalImages: number;
}
