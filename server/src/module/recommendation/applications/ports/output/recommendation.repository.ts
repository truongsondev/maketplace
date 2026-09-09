import {
  RecommendationAnalyticsResult,
  RecommendationEventPayload,
  RecommendationFeedResult,
  RecommendationItem,
} from '../../../entities/recommendation.types';

export interface IRecommendationRepository {
  getHomeRecommendations(limit: number, sessionId: string): Promise<RecommendationItem[]>;
  getProductRecommendations(productId: string, limit: number): Promise<RecommendationItem[]>;
  getCartRecommendations(userId: string, limit: number): Promise<RecommendationItem[]>;
  getPersonalizedRecommendations(
    userId: string,
    sessionId: string,
    limit: number,
  ): Promise<RecommendationItem[]>;
  getProductCards(
    items: RecommendationItem[],
  ): Promise<RecommendationFeedResult['items']>;
  saveTrackingEvent(event: RecommendationEventPayload): Promise<{ accepted: boolean; duplicated: boolean }>;
  refreshArtifacts(): Promise<void>;
  getAnalytics(fromDate?: string, toDate?: string): Promise<RecommendationAnalyticsResult>;
}

