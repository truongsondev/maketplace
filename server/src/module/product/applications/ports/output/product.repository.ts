import { Product } from '../../../entities/product/product.entity';

export interface ProductFilters {
  categorySlugOrId?: string;
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface IProductRepository {
  findWithFilters(
    filters: ProductFilters,
    pagination: PaginationParams,
  ): Promise<{ products: Product[]; total: number }>;

  findByIdWithDetails(id: string): Promise<Product | null>;
}
