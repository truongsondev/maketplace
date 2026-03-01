import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authService, type RegisterRequest } from "@/services/auth.service";
import type { ApiErrorResponse } from "@/types/api.types";

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterRequest) => authService.register(payload),

    onSuccess: () => {
      toast.success("Kiểm tra email của bạn!", {
        description:
          "Chúng tôi đã gửi link xác nhận vào email. Vui lòng kiểm tra hộp thư.",
        duration: 6000,
      });
    },

    onError: (err: ApiErrorResponse) => {
      toast.error("Đăng ký thất bại", {
        description:
          err?.error?.message ?? "Đã có lỗi xảy ra. Vui lòng thử lại.",
      });
    },
  });
}
