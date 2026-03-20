import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cartService, type AddToCartRequest } from "@/services/cart.service";
import { CART_QUERY_KEY } from "@/hooks/use-cart";
import type { ApiErrorResponse } from "@/types/api.types";

export function useAddToCart() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddToCartRequest) => cartService.addToCart(payload),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      toast.success("Đã thêm vào giỏ hàng", {
        description: `Số lượng: ${variables.quantity}`,
      });
    },

    onError: (err: ApiErrorResponse) => {
      const errorCode = err?.error?.code;
      const message =
        err?.error?.message ?? "Đã có lỗi xảy ra. Vui lòng thử lại.";

      if (errorCode === "UNAUTHORIZED") {
        toast.error("Bạn cần đăng nhập", {
          description: "Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.",
        });
        router.push("/login");
        return;
      }

      if (errorCode === "CONFLICT") {
        toast.warning("Không thể thêm vào giỏ", {
          description: message,
        });
        return;
      }

      if (errorCode === "VALIDATION_ERROR") {
        toast.warning("Dữ liệu chưa hợp lệ", {
          description: message,
        });
        return;
      }

      if (errorCode === "NOT_FOUND") {
        toast.error("Sản phẩm không còn khả dụng", {
          description: message,
        });
        return;
      }

      toast.error("Thêm vào giỏ thất bại", {
        description: message,
      });
    },
  });
}
