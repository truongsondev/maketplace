export interface GetProductsListCommand {
  // Pagination
  page?: number;
  limit?: number;

  // Search
  search?: string;

  // Filters
  categoryId?: string;
  status?: 'active' | 'inactive' | 'deleted';
  minPrice?: number;
  maxPrice?: number;
  stockStatus?: 'all' | 'low' | 'out';
  tagIds?: string;

  // Sorting
  sortBy?: 'name' | 'basePrice' | 'createdAt' | 'totalStock';
  sortOrder?: 'asc' | 'desc';
}

export interface GetProductsListResult {
  items: ProductListItemDto[];
  pagination: PaginationDto;
  aggregations: AggregationsDto;
}

export interface ProductListItemDto {
  id: string;
  name: string;
  basePrice: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  primaryImage?: {
    id: string;
    url: string;
    altText?: string;
  };
  variantsSummary: {
    count: number;
    firstSku?: string;
    priceRange: {
      min: number;
      max: number;
    };
    totalStock: number;
    lowStockCount: number;
  };
  categories: CategorySummaryDto[];
  tags: TagSummaryDto[];
}

export interface CategorySummaryDto {
  id: string;
  name: string;
  slug: string;
}

export interface TagSummaryDto {
  id: string;
  name: string;
  slug: string;
}

export interface PaginationDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AggregationsDto {
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
}
