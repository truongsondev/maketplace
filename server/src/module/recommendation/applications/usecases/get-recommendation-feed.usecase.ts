import { RecommendationFeedResult } from '../../entities/recommendation.types';
import { IRecommendationRepository } from '../ports/output/recommendation.repository';

type FeedKind = 'home' | 'product' | 'cart' | 'personalized';

const TITLES: Record<FeedKind, string> = {
  home: 'Xu hướng nổi bật',
  product: 'Bạn có thể cũng thích',
  cart: 'Phối cùng giỏ hàng của bạn',
  personalized: 'Dành riêng cho bạn',
};

const STRATEGIES: Record<FeedKind, string> = {
  home: 'trending+top_viewed+top_purchased',
  product: 'item_similarity+category_fallback',
  cart: 'cart_ai+category_fallback+cross_sell',
  personalized: 'recent_behavior+hybrid',
};

export class GetRecommendationFeedUseCase {
  constructor(private readonly recommendationRepository: IRecommendationRepository) {}

  async execute(input: {
    kind: FeedKind;
    userId?: string;
    productId?: string;
    sessionId: string;
    limit: number;
  }): Promise<RecommendationFeedResult> {
    let items;

    switch (input.kind) {
      case 'home':
        items = await this.recommendationRepository.getHomeRecommendations(
          input.limit,
          input.sessionId,
        );
        break;
      case 'product':
        items = await this.recommendationRepository.getProductRecommendations(
          input.productId!,
          input.limit,
        );
        break;
      case 'cart':
        items = await this.recommendationRepository.getCartRecommendations(input.userId!, input.limit);
        break;
      case 'personalized':
        items = await this.recommendationRepository.getPersonalizedRecommendations(
          input.userId!,
          input.sessionId,
          input.limit,
        );
        break;
    }

    const cards = await this.recommendationRepository.getProductCards(items);

    return {
      title: TITLES[input.kind],
      strategy: STRATEGIES[input.kind],
      generatedAt: new Date().toISOString(),
      items: cards,
    };
  }
}

