import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  cartService,
  type RemoveCartItemRequest,
  type UpdateCartItemRequest,
} from "@/services/cart.service";
import type { ApiErrorResponse } from "@/types/api.types";

export const CART_QUERY_KEY = ["cart"] as const;

function handleCartError(err: ApiErrorResponse, fallbackTitle: string) {
  const errorCode = err?.error?.code;
  const message = err?.error?.message ?? "Đã có lỗi xảy ra. Vui lòng thử lại.";

  if (errorCode === "UNAUTHORIZED") {
    toast.error("Bạn cần đăng nhập", {
      description: "Vui lòng đăng nhập để thao tác với giỏ hàng.",
    });
    return;
  }

  if (errorCode === "CONFLICT") {
    toast.warning("Không thể cập nhật giỏ hàng", {
      description: message,
    });
    return;
  }

  if (errorCode === "NOT_FOUND") {
    toast.error("Sản phẩm không còn trong giỏ", {
      description: message,
    });
    return;
  }

  toast.error(fallbackTitle, {
    description: message,
  });
}

export function useCart() {
  return useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: () => cartService.getCart(),
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateCartItemRequest) =>
      cartService.updateCartItem(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },

    onError: (err: ApiErrorResponse) => {
      handleCartError(err, "Cập nhật số lượng thất bại");
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RemoveCartItemRequest) =>
      cartService.removeCartItem(payload),

    onSuccess: () => {
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },

    onError: (err: ApiErrorResponse) => {
      handleCartError(err, "Xóa sản phẩm thất bại");
    },
  });
}
