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
  /** Nhan san pham moi */
  isNew: boolean;
  /** Nhan san pham dang sale */
  isSale: boolean;
}

export interface ProductListAggregationItem {
  /** Key ổn định (thường là option.value đã normalize) */
  value: string;
  /** Nhãn hiển thị (option.label) */
  label: string;
  /** Số lượng variant phù hợp */
  count: number;
}

export interface ProductListAggregations {
  sizes: ProductListAggregationItem[];
  colors: ProductListAggregationItem[];
}

export interface ProductListResult {
  products: ProductSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  /** Facets/aggregations để build UI filter (không bắt buộc) */
  aggregations?: ProductListAggregations;
}
