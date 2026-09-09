import type { AdminBannerSummary } from '../dto/admin-banner.dto';
import type { ISetAdminBannerStatusUseCase } from '../ports/input/admin-banner.usecase';
import type { IAdminBannerRepository } from '../ports/output/admin-banner.repository';

export class SetAdminBannerStatusUseCase implements ISetAdminBannerStatusUseCase {
  constructor(private readonly repository: IAdminBannerRepository) {}

  execute(id: string, isActive: boolean): Promise<AdminBannerSummary> {
    return this.repository.setStatus(id, isActive);
  }
}
