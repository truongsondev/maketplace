export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  /** URL ảnh chính */
  imageUrl: string | null;
  /** Giá thấp nhất trong các variant */
  minPrice: number;
  /** Giá gốc trước khi giảm (nếu có discount) */
  originalPrice?: number;
  /** % giảm giá (nếu có) */
  discountPercent?: number;
}

export interface ProductListResult {
  products: ProductSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
