export interface ExportProductsCommand {
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

export interface ExportProductsResult {
  csvContent: string;
  filename: string;
}
