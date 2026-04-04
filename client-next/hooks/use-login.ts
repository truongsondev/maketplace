import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService, type LoginRequest } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import type { ApiErrorResponse } from "@/types/api.types";

function resolvePostLoginPath(redirect?: string): string {
  if (!redirect) return "/";
  if (!redirect.startsWith("/") || redirect.startsWith("//")) return "/";
  if (redirect.startsWith("/login")) return "/";
  return redirect;
}

export function useLogin(redirectAfterLogin?: string) {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: (payload: LoginRequest) => authService.login(payload),

    onSuccess: (data) => {
      setSession({
        user: data.user,
        token: {
          accessToken: data.token.accessToken,
          refreshToken: data.token.refreshToken,
        },
      });
      toast.success("Chào mừng trở lại!", {
        description: `Đã đăng nhập với ${data.user.email}`,
      });
      router.replace(resolvePostLoginPath(redirectAfterLogin));
    },

    onError: (err: ApiErrorResponse) => {
      toast.error("Đăng nhập thất bại", {
        description:
          err?.error?.message ?? "Đã có lỗi xảy ra. Vui lòng thử lại.",
      });
    },
  });
}
