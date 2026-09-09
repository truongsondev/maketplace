import type { AdminBannerSummary, NormalizedAdminBannerInput } from '../../dto/admin-banner.dto';

export interface IAdminBannerRepository {
  list(params: {
    page: number;
    limit: number;
    search?: string;
    isActive?: boolean;
  }): Promise<{ items: AdminBannerSummary[]; total: number }>;
  getById(id: string): Promise<AdminBannerSummary | null>;
  create(input: NormalizedAdminBannerInput): Promise<AdminBannerSummary>;
  update(id: string, input: NormalizedAdminBannerInput): Promise<AdminBannerSummary>;
  setStatus(id: string, isActive: boolean): Promise<AdminBannerSummary>;
}
