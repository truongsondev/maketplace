import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { productService } from "@/services/product.service";
import { useAuthStore } from "@/stores/auth.store";
import type { ApiErrorResponse } from "@/types/api.types";

export const FAVORITE_PRODUCTS_QUERY_KEY = ["favorite-products"] as const;

export function useFavoriteProducts(page = 1, limit = 100) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: [...FAVORITE_PRODUCTS_QUERY_KEY, page, limit],
    queryFn: () => productService.getFavoriteProducts(page, limit),
    enabled: isAuthenticated,
    staleTime: 1000 * 30,
  });
}

export function useFavoriteIds() {
  const { data, ...query } = useFavoriteProducts();

  const favoriteIds = useMemo(
    () => new Set((data?.products ?? []).map((item) => item.productId)),
    [data?.products],
  );

  return {
    favoriteIds,
    ...query,
  };
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useMutation({
    mutationFn: async ({
      productId,
      isFavorite,
    }: {
      productId: string;
      isFavorite: boolean;
    }) => {
      if (!isAuthenticated) {
        throw {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Bạn cần đăng nhập để dùng danh sách yêu thích",
          },
        } as ApiErrorResponse;
      }

      if (isFavorite) {
        return productService.removeFromFavorites(productId);
      }

      return productService.addToFavorites(productId);
    },

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: FAVORITE_PRODUCTS_QUERY_KEY });

      if (variables.isFavorite) {
        toast.success("Đã bỏ khỏi danh sách yêu thích");
      } else {
        toast.success("Đã thêm vào danh sách yêu thích");
      }
    },

    onError: (err: ApiErrorResponse) => {
      const code = err?.error?.code;
      const message =
        err?.error?.message ?? "Đã có lỗi xảy ra. Vui lòng thử lại.";

      if (code === "UNAUTHORIZED") {
        toast.error("Bạn cần đăng nhập", {
          description: "Vui lòng đăng nhập để dùng danh sách yêu thích.",
        });
        router.push("/login");
        return;
      }

      if (code === "NOT_FOUND") {
        toast.error("Không tìm thấy sản phẩm", {
          description: message,
        });
        return;
      }

      toast.error("Không thể cập nhật yêu thích", {
        description: message,
      });
    },
  });
}
