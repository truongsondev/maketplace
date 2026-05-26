import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  authService,
  type ResetPasswordRequest,
} from "@/services/auth.service";
import type { ApiErrorResponse } from "@/types/api.types";

export function useResetPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: ResetPasswordRequest) =>
      authService.resetPassword(payload),

    onSuccess: () => {
      toast.success("Đã cập nhật mật khẩu", {
        description: "Bạn có thể đăng nhập bằng mật khẩu mới.",
      });
      router.replace("/login");
    },

    onError: (err: ApiErrorResponse) => {
      toast.error("Không thể đặt lại mật khẩu", {
        description:
          err?.error?.message ?? "Link đã hết hạn hoặc không hợp lệ.",
      });
    },
  });
}
