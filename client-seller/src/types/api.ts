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
