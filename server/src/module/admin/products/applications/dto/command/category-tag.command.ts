export interface GetCategoriesCommand {
  // Empty for now - get all categories
}

export interface GetCategoriesResult {
  categories: CategoryTreeDto[];
}

export interface CategoryTreeDto {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  sortOrder: number;
  children: CategoryTreeDto[];
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
