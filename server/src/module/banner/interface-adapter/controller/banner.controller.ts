import type { BannerSummary } from '../../applications/ports/output/banner.repository';
import { ListActiveBannersUseCase } from '../../applications/use-cases/list-active-banners.usecase';

export class BannerController {
  constructor(private readonly listActiveBannersUseCase: ListActiveBannersUseCase) {}

  listActiveBanners(): Promise<BannerSummary[]> {
    return this.listActiveBannersUseCase.execute();
  }
}
