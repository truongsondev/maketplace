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
  parentId: string | null;
  productCount: number;
}

/** Product từ API GET /api/products */
export interface ProductItem {
  id: string;
  name: string;
  slug?: string;
  imageUrl: string | null;
  minPrice: string | number;
  isNew?: boolean;
  isSale?: boolean;
}

export interface ProductListResponse {
  products: ProductItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  aggregations?: {
    sizes: { value: string; label: string; count: number }[];
    colors: { value: string; label: string; count: number }[];
  };
}

export interface CategoryShowcase {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  products: ProductItem[];
}

export interface FavoriteToggleResponse {
  productId: string;
  isFavorite: boolean;
  created?: boolean;
  removed?: boolean;
  favoritedAt?: string;
}

export interface FavoriteProductItem {
  productId: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  minPrice: number;
  favoritedAt: string;
}

export interface FavoriteProductsResponse {
  products: FavoriteProductItem[];
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

export interface ProductReviewImageItem {
  url: string;
  sortOrder: number;
}

export interface ProductReviewAuthor {
  label: string;
}

export interface ProductReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  author: ProductReviewAuthor;
  images: ProductReviewImageItem[];
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
  productAttributes: Array<{
    code: string;
    name: string;
    dataType: string;
    value: unknown;
    displayValue: string | string[] | null;
  }>;
  reviews: ProductReviews;
  reviewItems: ProductReviewItem[];
  createdAt: string;
  updatedAt: string;
}

export interface HomeTeamCard {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  collectionSlug: string;
  query: string;
  usageOccasion?: string;
  scope?: "all";
}

export interface HomeOutfitHighlight {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  ctaLabel: string;
  collectionSlug: string;
  query: string;
  usageOccasion?: string;
}

export interface HomeOutfitGalleryItem {
  id: string;
  imageUrl: string;
  collectionSlug: string;
  query: string;
  usageOccasion?: string;
}

export interface HomeTeamContentResponse {
  teamCards: HomeTeamCard[];
  highlights: HomeOutfitHighlight[];
  gallery: HomeOutfitGalleryItem[];
}
