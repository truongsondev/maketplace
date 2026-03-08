import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/product.service";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => productService.getCategoryStats(),
  });
}
