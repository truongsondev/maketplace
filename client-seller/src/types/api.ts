// API Interfaces
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  parentId: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface CategoryResponse {
  success: boolean;
  data: {
    categories: Category[];
    total: number;
  };
  message: string;
  timestamp: string;
}

export interface TagResponse {
  success: boolean;
  data: {
    tags: Tag[];
    total: number;
  };
  message: string;
  timestamp: string;
}

// Server API Interfaces
export interface CreateProductCommand {
  name: string;
  description?: string;
  basePrice: number;
  variants: CreateProductVariantDto[];
  images: CreateProductImageDto[]; // Ảnh chính của product
  categoryIds?: string[];
  tagIds?: string[];
}

export interface CreateProductVariantDto {
  sku: string;
  attributes: Record<string, string | number | boolean>;
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

export interface CloudinarySignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

export interface CloudinarySignatureResponse {
  success: boolean;
  data: CloudinarySignature;
  message: string;
  timestamp: string;
}

export interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
  variantId: string | null;
}

export interface ProductVariant {
  id: string;
  sku: string;
  attributes: Record<string, string | number | boolean>;
  price: number;
  stockAvailable: number;
  stockReserved: number;
  minStock: number;
  status: string;
  createdAt: string;
  images: ProductImage[];
}

export interface ProductListItem {
  id: string;
  name: string;
  basePrice: number;
  status: "active" | "inactive" | "deleted";
  createdAt: string;
  updatedAt: string;
  primaryImage: ProductImage | null;
  variantsSummary: {
    count: number;
    priceRange: {
      min: number;
      max: number;
    };
    totalStock: number;
    lowStockCount: number;
  };
  categories: Category[];
  tags: Tag[];
}

export interface ProductDetail {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  status: "active" | "inactive" | "deleted";
  createdAt: string;
  updatedAt: string;
  variants: ProductVariant[];
  images: ProductImage[];
  categories: Category[];
  tags: Tag[];
  stats: {
    totalVariants: number;
    totalStock: number;
    lowStockVariants: number;
    totalImages: number;
  };
}

export interface ProductListFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  status?: "active" | "inactive" | "deleted";
  minPrice?: number;
  maxPrice?: number;
  stockStatus?: "all" | "low" | "out";
  tagIds?: string;
  sortBy?: "name" | "basePrice" | "createdAt" | "totalStock";
  sortOrder?: "asc" | "desc";
}

export interface ProductListResponse {
  success: boolean;
  data: {
    items: ProductListItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    aggregations: {
      statusCount: {
        active: number;
        inactive: number;
        deleted: number;
      };
      stockStatus: {
        all: number;
        low: number;
        out: number;
      };
    };
  };
}

export interface ProductDetailResponse {
  success: boolean;
  data: ProductDetail;
}

export interface InventoryLog {
  id: string;
  variantId: string;
  action: "IMPORT" | "EXPORT" | "RETURN" | "ADJUSTMENT";
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  referenceId: string | null;
  referenceType: string | null;
  note: string | null;
  actorId: string;
  createdAt: string;
}

export interface InventoryLogsResponse {
  success: boolean;
  data: {
    items: InventoryLog[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface UpdateProductCommand {
  name?: string;
  description?: string;
  basePrice?: number;
  status?: "active" | "inactive";
  categoryIds?: string[];
  tagIds?: string[];
  variants?: UpdateProductVariantDto[];
  images?: UpdateProductImageDto[];
}

export interface UpdateProductVariantDto {
  id?: string;
  sku: string;
  attributes: Record<string, string | number | boolean>;
  price: number;
  stockAvailable?: number;
  minStock?: number;
}

export interface UpdateProductImageDto {
  id?: string;
  url: string;
  altText?: string;
  sortOrder?: number;
  isPrimary?: boolean;
  variantId?: string | null;
}

export interface BulkDeleteRequest {
  productIds: string[];
}

export interface BulkAssignCategoriesRequest {
  productIds: string[];
  categoryIds: string[];
  mode: "append" | "replace";
}

export interface BulkAssignTagsRequest {
  productIds: string[];
  tagIds: string[];
  mode: "append" | "replace";
}

export interface AdjustStockRequest {
  action: "IMPORT" | "EXPORT" | "ADJUSTMENT";
  quantity: number;
  referenceId?: string;
  note?: string;
}

export type VoucherType = "PERCENTAGE" | "FIXED_AMOUNT";

export interface VoucherItem {
  id: string;
  code: string;
  description: string | null;
  type: VoucherType;
  value: number;
  maxDiscount: number | null;
  minOrderAmount: number | null;
  maxUsage: number | null;
  userUsageLimit: number | null;
  usedCount: number;
  startAt: string;
  endAt: string;
  isActive: boolean;
  bannerImageUrl: string | null;
}

export interface VoucherListResponse {
  success: boolean;
  data: {
    items: VoucherItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  message: string;
  timestamp: string;
}

export interface VoucherResponse {
  success: boolean;
  data: VoucherItem;
  message: string;
  timestamp: string;
}

export interface VoucherUpsertCommand {
  code: string;
  description?: string | null;
  type: VoucherType;
  value: number;
  maxDiscount?: number | null;
  minOrderAmount?: number | null;
  maxUsage?: number | null;
  userUsageLimit?: number | null;
  startAt: string;
  endAt: string;
  isActive?: boolean;
  bannerImageUrl?: string | null;
}
