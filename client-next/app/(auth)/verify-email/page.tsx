"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";

type Status = "loading" | "success" | "error" | "missing-token";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const setSession = useAuthStore((s) => s.setSession);

  const [status, setStatus] = useState<Status>(
    token ? "loading" : "missing-token",
  );
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (!token) return;

    authService
      .verifyEmail(token)
      .then((data) => {
        setSession({
          user: data.user,
          token: {
            accessToken: data.token.accessToken,
            refreshToken: data.token.refreshToken,
          },
        });
        setStatus("success");
        setTimeout(() => router.replace("/"), 3000);
      })
      .catch((err) => {
        setErrorMessage(
          err?.error?.message ?? "Link xác nhận không hợp lệ hoặc đã hết hạn.",
        );
        setStatus("error");
      });
  }, []);

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-border-color overflow-hidden relative z-10">
      {/* Gradient top border */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-primary to-orange-400" />

      <div className="px-8 py-14 flex flex-col items-center gap-5 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="size-14 text-primary animate-spin" />
            <h2 className="text-2xl font-black text-text-main">
              Đang xác nhận…
            </h2>
            <p className="text-text-muted">Vui lòng chờ trong giây lát.</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="size-14 text-green-500" />
            <h2 className="text-2xl font-black text-text-main">
              Xác nhận thành công!
            </h2>
            <p className="text-text-muted">
              Email của bạn đã được xác nhận. Bạn sẽ được chuyển về trang chủ
              sau 3 giây.
            </p>
            <Link
              href="/"
              className="mt-2 inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 hover:bg-primary-dark transition-all"
            >
              Về trang chủ ngay
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="size-14 text-red-500" />
            <h2 className="text-2xl font-black text-text-main">
              Xác nhận thất bại
            </h2>
            <p className="text-text-muted">{errorMessage}</p>
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 hover:bg-primary-dark transition-all"
              >
                Đăng ký lại
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-border-color px-6 py-3 text-sm font-bold text-text-main hover:border-primary hover:text-primary transition-all"
              >
                Đăng nhập
              </Link>
            </div>
          </>
        )}

        {status === "missing-token" && (
          <>
            <XCircle className="size-14 text-red-500" />
            <h2 className="text-2xl font-black text-text-main">
              Liên kết không hợp lệ
            </h2>
            <p className="text-text-muted">
              Không tìm thấy mã xác nhận. Vui lòng kiểm tra lại email.
            </p>
            <Link
              href="/register"
              className="mt-2 inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 hover:bg-primary-dark transition-all"
            >
              Đăng ký lại
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-border-color overflow-hidden relative z-10">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-primary to-orange-400" />
          <div className="px-8 py-14 flex flex-col items-center gap-5 text-center">
            <Loader2 className="size-14 text-primary animate-spin" />
            <h2 className="text-2xl font-black text-text-main">Đang tải...</h2>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
