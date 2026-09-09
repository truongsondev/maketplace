import { Product } from '../../../entities/product/product.entity';
import { ProductListAggregations } from '../../dto/result/product-list.result';

export interface ProductFilters {
  categorySlugOrId?: string;
  size?: string;
  color?: string;
  search?: string;
  usageOccasion?: string;
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

export interface HomeTeamCard {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  collectionSlug: string;
  query: string;
  usageOccasion?: string;
  scope?: 'all';
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

export interface HomeTeamContent {
  teamCards: HomeTeamCard[];
  highlights: HomeOutfitHighlight[];
  gallery: HomeOutfitGalleryItem[];
}

export interface IProductRepository {
  findWithFilters(
    filters: ProductFilters,
    pagination: PaginationParams,
  ): Promise<{ products: Product[]; total: number; aggregations?: ProductListAggregations }>;

  findByIdWithDetails(id: string): Promise<Product | null>;

  findCategoryShowcases(categoryLimit: number, productLimit: number): Promise<CategoryShowcase[]>;

  findHomeTeamContent(): Promise<HomeTeamContent>;
}
