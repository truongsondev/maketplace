export interface Product {
  id: number;
  name: string;
  color: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  badgeColor: string;
  image: string;
}

export interface Category {
  name: string;
  count: string;
  image: string;
}

/** Response từ GET /api/products/categories/stats */
export interface CategoryStat {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  productCount: number;
}

/** Product từ API GET /api/products */
export interface ProductItem {
  id: string;
  name: string;
  imageUrl: string | null;
  minPrice: string;
}

export interface ProductListResponse {
  products: ProductItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Color {
  name: string;
  value: string;
  textColor: string;
}

/** Product Detail Response */
export interface ProductImage {
  id: string;
  url: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  attributes: Record<string, string>;
  price: number;
  stockAvailable: number;
  images: ProductImage[];
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ProductTag {
  id: string;
  name: string;
  slug: string;
}

export interface ProductReviews {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<string, number>;
}

export interface ProductDetail {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  images: ProductImage[];
  variants: ProductVariant[];
  categories: ProductCategory[];
  tags: ProductTag[];
  reviews: ProductReviews;
  createdAt: string;
  updatedAt: string;
}
