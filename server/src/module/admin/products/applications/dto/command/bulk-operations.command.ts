export interface BulkAssignCategoriesCommand {
  productIds: string[];
  categoryIds: string[];
  mode: 'append' | 'replace';
}

export interface BulkAssignCategoriesResult {
  success: boolean;
  message: string;
}

export interface BulkAssignTagsCommand {
  productIds: string[];
  tagIds: string[];
  mode: 'append' | 'replace';
}

export interface BulkAssignTagsResult {
  success: boolean;
  message: string;
}
