import { useQuery } from "@tanstack/react-query";
import { getSessionId } from "@/lib/session-id";
import { recommendationService } from "@/services/recommendation.service";
import { useAuthStore } from "@/stores/auth.store";

export function useHomeRecommendations(limit = 8, enabled = true) {
  return useQuery({
    queryKey: ["recommendations", "home", limit],
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
  return useQuery({
    queryKey: ["recommendations", "product", productId, limit],
    queryFn: () => recommendationService.getProduct(productId, limit),
    enabled: enabled && Boolean(productId),
    staleTime: 1000 * 60 * 10,
    retry: false,
  });
}

export function useCartRecommendations(limit = 8, enabled = true) {
  const userId = useAuthStore((state) => state.user?.id);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const sessionId = typeof window === "undefined" ? "server" : getSessionId();

  return useQuery({
    queryKey: ["recommendations", "cart", userId ?? "guest", sessionId, limit],
    queryFn: () => recommendationService.getCart(limit),
    enabled: enabled && isAuthenticated && Boolean(userId),
    staleTime: 1000 * 60 * 2,
    retry: false,
  });
}

export function usePersonalizedRecommendations(limit = 10, enabled = true) {
  const userId = useAuthStore((state) => state.user?.id);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const sessionId = typeof window === "undefined" ? "server" : getSessionId();

  return useQuery({
    queryKey: [
      "recommendations",
      "personalized",
      userId ?? "guest",
      sessionId,
      limit,
    ],
    queryFn: () => recommendationService.getPersonalized(limit),
    enabled: enabled && isAuthenticated && Boolean(userId),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}
