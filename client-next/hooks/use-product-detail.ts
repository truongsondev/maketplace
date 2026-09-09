import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/product.service";

export function useProductDetail(id: string) {
  return useQuery({
    queryKey: ["id", id],
    queryFn: () => productService.getProductDetail(id),
    enabled: !!id,
  });
}
