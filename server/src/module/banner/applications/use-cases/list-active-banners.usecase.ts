import type { BannerSummary, IBannerRepository } from '../ports/output/banner.repository';

export class ListActiveBannersUseCase {
  constructor(private readonly repository: IBannerRepository) {}

  execute(): Promise<BannerSummary[]> {
    return this.repository.listActive();
  }
}
