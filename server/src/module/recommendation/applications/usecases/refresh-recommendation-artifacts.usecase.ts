import { IRecommendationRepository } from '../ports/output/recommendation.repository';

export class RefreshRecommendationArtifactsUseCase {
  constructor(private readonly recommendationRepository: IRecommendationRepository) {}

  async execute(): Promise<void> {
    await this.recommendationRepository.refreshArtifacts();
  }
}

