import type { AdminBannerSummary } from '../dto/admin-banner.dto';
import type { IListAdminBannersUseCase } from '../ports/input/admin-banner.usecase';
import type { IAdminBannerRepository } from '../ports/output/admin-banner.repository';

export class ListAdminBannersUseCase implements IListAdminBannersUseCase {
  constructor(private readonly repository: IAdminBannerRepository) {}

  execute(params: {
    page: number;
    limit: number;
    search?: string;
    isActive?: boolean;
  }): Promise<{ items: AdminBannerSummary[]; total: number }> {
    return this.repository.list(params);
  }
}
