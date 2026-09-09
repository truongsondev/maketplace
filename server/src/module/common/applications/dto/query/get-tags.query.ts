export interface GetTagsQuery {
  search?: string;
  limit?: number;
  offset?: number;
}

export interface TagDto {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetTagsResult {
  tags: TagDto[];
  total: number;
}
