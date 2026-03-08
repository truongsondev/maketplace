export interface GetCategoriesQuery {
  parentId?: string;
  includeChildren?: boolean;
}

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  sortOrder: number;
  children?: CategoryDto[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GetCategoriesResult {
  categories: CategoryDto[];
  total: number;
}
