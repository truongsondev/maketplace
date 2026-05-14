import { useQuery } from "@tanstack/react-query";
import { getSessionId } from "@/lib/session-id";
import { recommendationService } from "@/services/recommendation.service";
import { useAuthStore } from "@/stores/auth.store";

const RECOMMENDATION_QUERY_VERSION = "v2";

function useResolvedUserId() {
  return useAuthStore(
    (state) => state.user?.id ?? state.profile?.userId ?? null,
  );
}

export function useHomeRecommendations(limit = 8, enabled = true) {
  const sessionId = typeof window === "undefined" ? "server" : getSessionId();

  return useQuery({
    queryKey: [
      "recommendations",
      RECOMMENDATION_QUERY_VERSION,
      "home",
      sessionId,
      limit,
    ],
    queryFn: () => recommendationService.getHome(limit),
    enabled,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useProductRecommendations(
  productId: string,
  limit = 8,
  enabled = true,
) {
  const sessionId = typeof window === "undefined" ? "server" : getSessionId();

  return useQuery({
    queryKey: [
      "recommendations",
      RECOMMENDATION_QUERY_VERSION,
      "product",
      productId,
      sessionId,
      limit,
    ],
    queryFn: () => recommendationService.getProduct(productId, limit),
    enabled: enabled && Boolean(productId),
    staleTime: 1000 * 60 * 10,
    retry: false,
  });
}

export function useCartRecommendations(limit = 8, enabled = true) {
  const userId = useResolvedUserId();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const sessionId = typeof window === "undefined" ? "server" : getSessionId();

  return useQuery({
    queryKey: [
      "recommendations",
      RECOMMENDATION_QUERY_VERSION,
      "cart",
      isAuthenticated ? (userId ?? "authenticated") : "guest",
      sessionId,
      limit,
    ],
    queryFn: () => recommendationService.getCart(limit),
    enabled: enabled && isAuthenticated,
    staleTime: 1000 * 60 * 2,
    retry: false,
  });
}

export function usePersonalizedRecommendations(limit = 10, enabled = true) {
  const userId = useResolvedUserId();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const sessionId = typeof window === "undefined" ? "server" : getSessionId();

  return useQuery({
    queryKey: [
      "recommendations",
      RECOMMENDATION_QUERY_VERSION,
      "personalized",
      isAuthenticated ? (userId ?? "authenticated") : "guest",
      sessionId,
      limit,
    ],
    queryFn: () => recommendationService.getPersonalized(limit),
    enabled: enabled && isAuthenticated,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}
