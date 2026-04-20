export interface ProductVariantDetail {
  id: string;
  sku: string;
  attributes: Record<string, any>; // { color: "Trắng", size: "M" }
  price: number;
  stockAvailable: number;
  images: ProductImageDetail[];
}

export interface ProductImageDetail {
  id: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

export interface CategoryDetail {
  id: string;
  name: string;
  slug: string;
}

export interface TagDetail {
  id: string;
  name: string;
  slug: string;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface ReviewImageItem {
  url: string;
  sortOrder: number;
}

export interface ReviewAuthor {
  label: string;
}

export interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  author: ReviewAuthor;
  images: ReviewImageItem[];
}

export interface ProductAttributeDetail {
  code: string;
  name: string;
  dataType: string;
  value: unknown;
  displayValue: string | string[] | null;
}

export interface ProductDetailResult {
  // Basic info
  id: string;
  name: string;
  description: string | null;
  basePrice: number;

  // Images (chung cho product)
  images: ProductImageDetail[];

  // Variants (màu sắc, kích thước)
  variants: ProductVariantDetail[];

  // Categories & Tags
  categories: CategoryDetail[];
  tags: TagDetail[];
  productAttributes: ProductAttributeDetail[];

  // Reviews
  reviews: ReviewSummary;
  reviewItems: ReviewItem[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
