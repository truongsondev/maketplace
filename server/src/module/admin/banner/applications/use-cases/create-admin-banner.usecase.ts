import type { AdminBannerInput, AdminBannerSummary } from '../dto/admin-banner.dto';
import type { ICreateAdminBannerUseCase } from '../ports/input/admin-banner.usecase';
import type { IAdminBannerRepository } from '../ports/output/admin-banner.repository';
import { AdminBannerRulesService } from '../services/admin-banner-rules.service';

export class CreateAdminBannerUseCase implements ICreateAdminBannerUseCase {
  constructor(private readonly repository: IAdminBannerRepository) {}

  async execute(input: AdminBannerInput): Promise<AdminBannerSummary> {
    const normalized = AdminBannerRulesService.normalizeInput(input);
    return this.repository.create(normalized);
  }
}
