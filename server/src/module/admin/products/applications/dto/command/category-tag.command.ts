export interface GetCategoriesCommand {
  // Empty for now - get all categories
}

export interface GetCategoriesResult {
  categories: CategoryDto[];
}

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
}

export interface GetTagsCommand {
  search?: string;
  limit?: number;
}

export interface GetTagsResult {
  tags: TagDto[];
}

export interface TagDto {
  id: string;
  name: string;
  slug: string;
}
