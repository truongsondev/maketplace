import { Product } from '../../../entities/product/product.entity';

export interface ProductFilters {
  categorySlugOrId?: string;
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  sortField?: 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface CategoryShowcaseProduct {
  id: string;
  name: string;
  imageUrl: string | null;
  minPrice: number;
  isNew: boolean;
  isSale: boolean;
}

export interface CategoryShowcase {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  products: CategoryShowcaseProduct[];
}

export interface IProductRepository {
  findWithFilters(
    filters: ProductFilters,
    pagination: PaginationParams,
  ): Promise<{ products: Product[]; total: number }>;

  findByIdWithDetails(id: string): Promise<Product | null>;

  findCategoryShowcases(categoryLimit: number, productLimit: number): Promise<CategoryShowcase[]>;
}
