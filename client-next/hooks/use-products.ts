import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/product.service";

type UseProductsParams = {
  page?: number;
  limit?: number;
  sort?: string;
  c?: string;
  s?: string;
  cl?: string;
  p?: string;
};

export function useProducts(params: UseProductsParams = {}) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => productService.getProducts(params),
  });
}
