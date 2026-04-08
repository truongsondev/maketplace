export interface BannerSummary {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  imageUrl: string;
  sortOrder: number;
}

export interface IBannerRepository {
  listActive(): Promise<BannerSummary[]>;
}
