"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";

function resolveSafeRedirect(redirect?: string): string {
  if (!redirect) return "/";
  if (!redirect.startsWith("/") || redirect.startsWith("//")) return "/";
  if (redirect.startsWith("/login")) return "/";
  return redirect;
}

export function GoogleOAuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    const code = searchParams.get("code") ?? undefined;
    const redirect = searchParams.get("redirect") ?? undefined;

    if (!code) {
      toast.error("Đăng nhập Google thất bại", {
        description: "Thiếu mã xác thực (code).",
      });
      router.replace("/login");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const data = await authService.exchangeGoogleOAuthCode(code);
        if (cancelled) return;

        setSession({
          user: data.user,
          token: {
            accessToken: data.token.accessToken,
            refreshToken: data.token.refreshToken,
          },
        });

        toast.success("Đăng nhập Google thành công");
        router.replace(resolveSafeRedirect(redirect));
      } catch (err: any) {
        if (cancelled) return;
        toast.error("Đăng nhập Google thất bại", {
          description: err?.error?.message ?? "Vui lòng thử lại.",
        });
        router.replace("/login");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams, setSession]);

  return (
    <main className="grow w-full max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="rounded-sm border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="text-lg font-bold text-neutral-900 dark:text-white">
          Đang xác thực Google…
        </h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Vui lòng chờ trong giây lát.
        </p>
      </div>
    </main>
  );
}
