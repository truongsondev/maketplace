import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/product.service";

export function useCategories(nonEmptyOnly = false) {
  return useQuery({
    queryKey: ["categories", nonEmptyOnly],
    queryFn: () => productService.getCategoryStats(nonEmptyOnly),
  });
}
