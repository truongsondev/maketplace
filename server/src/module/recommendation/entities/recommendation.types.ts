export type RecommendationItem = {
  productId: string;
  score: number;
  reason: string;
  source: string;
};

export type RecommendationProductCard = {
  id: string;
  name: string;
  imageUrl: string | null;
  minPrice: number;
  isNew: boolean;
  isSale: boolean;
};

export type RecommendationFeedResult = {
  title: string;
  strategy: string;
  generatedAt: string;
  items: Array<RecommendationProductCard & { score: number; reason: string; source: string }>;
};

export type RecommendationEventPayload = {
  eventType:
    | 'VIEW_PRODUCT'
    | 'ADD_TO_CART'
    | 'REMOVE_FROM_CART'
    | 'PURCHASE'
    | 'SEARCH_QUERY'
    | 'FAVORITE_PRODUCT';
  userId?: string | null;
  sessionId: string;
  productId?: string | null;
  orderId?: string | null;
  searchQuery?: string | null;
  source?: string | null;
  placement?: string | null;
  metadata?: Record<string, unknown> | null;
  dedupeKey: string;
  occurredAt: string;
};

export type RecommendationAnalyticsResult = {
  generatedAt: string;
  totals: {
    events: number;
    uniqueSessions: number;
    productViews: number;
    purchases: number;
  };
  eventBreakdown: Array<{ eventType: string; total: number }>;
  topProducts: Array<{ productId: string; name: string; total: number }>;
};

