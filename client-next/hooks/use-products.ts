import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/product.service";

type UseProductsParams = {
  page?: number;
  limit?: number;
  sort?: string;
  c?: string;
  s?: string;
  cl?: string;
  uo?: string;
  p?: string;
  q?: string;
};

export function useProducts(params: UseProductsParams = {}) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => productService.getProducts(params),
  });
}

export function useRelatedProductsFromMyOrders(limit = 12, enabled = true) {
  return useQuery({
    queryKey: ["products", "related", "my-orders", limit],
    queryFn: () => productService.getRelatedFromMyOrders(limit),
    enabled,
    staleTime: 1000 * 60,
    retry: false,
  });
}
