import { RecommendationAnalyticsResult, RecommendationEventPayload, RecommendationFeedResult } from '../../entities/recommendation.types';
import { GetRecommendationAnalyticsUseCase } from '../../applications/usecases/get-recommendation-analytics.usecase';
import { GetRecommendationFeedUseCase } from '../../applications/usecases/get-recommendation-feed.usecase';
import { TrackRecommendationEventUseCase } from '../../applications/usecases/track-recommendation-event.usecase';

export class RecommendationController {
  constructor(
    private readonly getRecommendationFeedUseCase: GetRecommendationFeedUseCase,
    private readonly trackRecommendationEventUseCase: TrackRecommendationEventUseCase,
    private readonly getRecommendationAnalyticsUseCase: GetRecommendationAnalyticsUseCase,
  ) {}

  getHome(sessionId: string, limit: number): Promise<RecommendationFeedResult> {
    return this.getRecommendationFeedUseCase.execute({
      kind: 'home',
      sessionId,
      limit,
    });
  }

  getProduct(productId: string, sessionId: string, limit: number): Promise<RecommendationFeedResult> {
    return this.getRecommendationFeedUseCase.execute({
      kind: 'product',
      productId,
      sessionId,
      limit,
    });
  }

  getCart(userId: string, sessionId: string, limit: number): Promise<RecommendationFeedResult> {
    return this.getRecommendationFeedUseCase.execute({
      kind: 'cart',
      userId,
      sessionId,
      limit,
    });
  }

  getPersonalized(
    userId: string,
    sessionId: string,
    limit: number,
  ): Promise<RecommendationFeedResult> {
    return this.getRecommendationFeedUseCase.execute({
      kind: 'personalized',
      userId,
      sessionId,
      limit,
    });
  }

  track(payload: RecommendationEventPayload): Promise<{ accepted: boolean; duplicated: boolean }> {
    return this.trackRecommendationEventUseCase.execute(payload);
  }

  getAnalytics(fromDate?: string, toDate?: string): Promise<RecommendationAnalyticsResult> {
    return this.getRecommendationAnalyticsUseCase.execute(fromDate, toDate);
  }
}

