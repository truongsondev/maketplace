import type { AdminBannerInput, AdminBannerSummary } from '../dto/admin-banner.dto';
import type { IUpdateAdminBannerUseCase } from '../ports/input/admin-banner.usecase';
import type { IAdminBannerRepository } from '../ports/output/admin-banner.repository';
import { AdminBannerRulesService } from '../services/admin-banner-rules.service';

export class UpdateAdminBannerUseCase implements IUpdateAdminBannerUseCase {
  constructor(private readonly repository: IAdminBannerRepository) {}

  async execute(id: string, input: AdminBannerInput): Promise<AdminBannerSummary> {
    const normalized = AdminBannerRulesService.normalizeInput(input);
    return this.repository.update(id, normalized);
  }
}
