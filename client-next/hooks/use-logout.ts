import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import type { ApiErrorResponse } from "@/types/api.types";

export function useLogout() {
  const router = useRouter();
  const { token, clearSession } = useAuthStore((s) => ({
    token: s.token,
    clearSession: s.clearSession,
  }));

  return useMutation({
    mutationFn: () => authService.logout({ refreshToken: token.refreshToken }),

    onSuccess: () => {
      clearSession();
      toast.success("Đăng xuất thành công!", {
        description: "",
      });
      router.push("/");
    },

    onError: (err: ApiErrorResponse) => {
      clearSession();
      toast.success("Đăng xuất thành công!", {
        description: "",
      });
      router.push("/");
      console.error("Logout API error:", err);
    },
  });
}
