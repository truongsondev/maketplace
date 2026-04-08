export interface AdminBannerSummary {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminBannerInput {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  imageUrl: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface NormalizedAdminBannerInput {
  title: string;
  subtitle: string | null;
  description: string | null;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
}
