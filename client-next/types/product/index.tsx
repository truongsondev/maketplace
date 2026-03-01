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
