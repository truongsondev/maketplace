export interface CategoryStatsResult {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  parentId: string | null;
  productCount: number;
}
