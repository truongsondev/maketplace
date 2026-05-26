import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  authService,
  type ForgotPasswordRequest,
} from "@/services/auth.service";
import type { ApiErrorResponse } from "@/types/api.types";

export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordRequest) =>
      authService.forgotPassword(payload),

    onSuccess: (data) => {
      toast.success("Kiểm tra email của bạn", {
        description:
          data.message ??
          "Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu.",
        duration: 6000,
      });
    },

    onError: (err: ApiErrorResponse) => {
      toast.error("Không thể gửi yêu cầu", {
        description:
          err?.error?.message ?? "Đã có lỗi xảy ra. Vui lòng thử lại.",
      });
    },
  });
}
