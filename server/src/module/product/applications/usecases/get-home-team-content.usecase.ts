import { createLogger } from '../../../../shared/util/logger';
import { HomeTeamContentResult } from '../dto/result/home-team-content.result';
import { IGetHomeTeamContentUseCase } from '../ports/input/get-home-team-content.usecase';
import { IProductRepository } from '../ports/output/product.repository';

export class GetHomeTeamContentUseCase implements IGetHomeTeamContentUseCase {
  private readonly logger = createLogger('GetHomeTeamContentUseCase');

  constructor(private readonly productRepository: IProductRepository) {}

  async execute(): Promise<HomeTeamContentResult> {
    const content = await this.productRepository.findHomeTeamContent();

    this.logger.info('Home team content fetched', {
      teamCards: content.teamCards.length,
      highlights: content.highlights.length,
      gallery: content.gallery.length,
    });

    return content;
  }
}
