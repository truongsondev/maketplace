export interface GetCategoriesQuery {
}

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetCategoriesResult {
  categories: CategoryDto[];
  total: number;
}
