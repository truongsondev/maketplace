import { apiClient } from "@/lib/api-client";
import { getSessionId } from "@/lib/session-id";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api.types";
import type { RecommendationFeed } from "@/types/recommendation.types";

function buildQuery(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

async function getFeed(path: string, limit: number): Promise<RecommendationFeed> {
  const response = await apiClient.get<RecommendationFeed>(
    `${path}${buildQuery({ limit, sessionId: getSessionId() })}`,
  );

  if (response.success) {
    return (response as ApiSuccessResponse<RecommendationFeed>).data;
  }

  throw response as ApiErrorResponse;
}

export const recommendationService = {
  getHome(limit = 8) {
    return getFeed("api/recommendations/home", limit);
  },

  getProduct(productId: string, limit = 8) {
    return getFeed(`api/recommendations/product/${productId}`, limit);
  },

  getCart(limit = 8) {
    return getFeed("api/recommendations/cart", limit);
  },

  getPersonalized(limit = 10) {
    return getFeed("api/recommendations/personalized", limit);
  },
};

