import { RecommendationAnalyticsResult } from '../../entities/recommendation.types';
import { IRecommendationRepository } from '../ports/output/recommendation.repository';

export class GetRecommendationAnalyticsUseCase {
  constructor(private readonly recommendationRepository: IRecommendationRepository) {}

  async execute(fromDate?: string, toDate?: string): Promise<RecommendationAnalyticsResult> {
    return this.recommendationRepository.getAnalytics(fromDate, toDate);
  }
}

