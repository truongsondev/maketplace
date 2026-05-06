import { useQuery } from "@tanstack/react-query";
import { recommendationService } from "@/services/recommendation.service";

export function useHomeRecommendations(limit = 8) {
  return useQuery({
    queryKey: ["recommendations", "home", limit],
    queryFn: () => recommendationService.getHome(limit),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useProductRecommendations(productId: string, limit = 8) {
  return useQuery({
    queryKey: ["recommendations", "product", productId, limit],
    queryFn: () => recommendationService.getProduct(productId, limit),
    enabled: Boolean(productId),
    staleTime: 1000 * 60 * 10,
    retry: false,
  });
}

export function useCartRecommendations(limit = 8, enabled = true) {
  return useQuery({
    queryKey: ["recommendations", "cart", limit],
    queryFn: () => recommendationService.getCart(limit),
    enabled,
    staleTime: 1000 * 60 * 2,
    retry: false,
  });
}

export function usePersonalizedRecommendations(limit = 10, enabled = true) {
  return useQuery({
    queryKey: ["recommendations", "personalized", limit],
    queryFn: () => recommendationService.getPersonalized(limit),
    enabled,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

