import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/product.service";

export function useHomeTeamContent() {
  return useQuery({
    queryKey: ["home", "team-content"],
    queryFn: () => productService.getHomeTeamContent(),
    staleTime: 1000 * 60 * 5,
  });
}
