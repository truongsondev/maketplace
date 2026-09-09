import { BadRequestError } from '../../../../../error-handlling/badRequestError';
import type { AdminBannerSummary } from '../dto/admin-banner.dto';
import type { IGetAdminBannerByIdUseCase } from '../ports/input/admin-banner.usecase';
import type { IAdminBannerRepository } from '../ports/output/admin-banner.repository';

export class GetAdminBannerByIdUseCase implements IGetAdminBannerByIdUseCase {
  constructor(private readonly repository: IAdminBannerRepository) {}

  async execute(id: string): Promise<AdminBannerSummary> {
    const banner = await this.repository.getById(id);
    if (!banner) {
      throw new BadRequestError('Banner not found');
    }
    return banner;
  }
}
