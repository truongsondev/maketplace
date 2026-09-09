import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ApiErrorResponse } from "@/types/api.types";
import { reviewService } from "@/services/review.service";
import type {
  CloudinarySignature,
  CreateReviewPayload,
} from "@/types/review.types";
import { ORDERS_QUERY_KEY } from "@/hooks/use-orders";

export const ORDER_REVIEW_STATUS_QUERY_KEY = ["order-review-status"] as const;

function handleReviewError(err: ApiErrorResponse, fallbackTitle: string) {
  const message = err?.error?.message ?? "Đã có lỗi xảy ra. Vui lòng thử lại.";

  if (err?.error?.code === "UNAUTHORIZED") {
    toast.error("Bạn cần đăng nhập", {
      description: "Vui lòng đăng nhập để đánh giá sản phẩm.",
    });
    return;
  }

  toast.error(fallbackTitle, { description: message });
}

export function useOrderReviewStatus(orderId: string, enabled = true) {
  return useQuery({
    queryKey: [...ORDER_REVIEW_STATUS_QUERY_KEY, orderId],
    queryFn: () => reviewService.getOrderReviewStatus(orderId),
    enabled: Boolean(orderId) && enabled,
  });
}

export function useReviewUploadSignature() {
  return useMutation({
    mutationFn: (params: { orderId?: string }) =>
      reviewService.getUploadSignature(params),
    onError: (err: ApiErrorResponse) => {
      handleReviewError(err, "Không lấy được chữ ký upload");
    },
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateReviewPayload) =>
      reviewService.createReview(payload),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [...ORDER_REVIEW_STATUS_QUERY_KEY],
        }),
        // product detail pulls review summary from /api/products/:id; keep it fresh
        queryClient.invalidateQueries({ queryKey: [...ORDERS_QUERY_KEY] }),
      ]);

      toast.success("Đã gửi đánh giá", {
        description: variables.comment ? "Cảm ơn bạn đã chia sẻ." : undefined,
      });
    },
    onError: (err: ApiErrorResponse) => {
      handleReviewError(err, "Gửi đánh giá thất bại");
    },
  });
}

export function useUploadReviewImage() {
  return useMutation({
    mutationFn: (params: { file: File; signature: CloudinarySignature }) =>
      reviewService.uploadImageToCloudinary(params.file, params.signature),
  });
}
