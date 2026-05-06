import { RecommendationEventPayload } from '../../entities/recommendation.types';
import { IRecommendationRepository } from '../ports/output/recommendation.repository';

export class TrackRecommendationEventUseCase {
  constructor(private readonly recommendationRepository: IRecommendationRepository) {}

  async execute(event: RecommendationEventPayload): Promise<{ accepted: boolean; duplicated: boolean }> {
    return this.recommendationRepository.saveTrackingEvent(event);
  }
}

