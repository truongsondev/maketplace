import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/product.service";

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: () => productService.getProducts(),
  });
}
