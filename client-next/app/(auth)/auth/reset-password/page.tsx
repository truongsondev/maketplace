import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Đặt lại mật khẩu - VibeFashion",
  description: "Tạo mật khẩu mới cho tài khoản VibeFashion.",
};

export default function ResetPasswordPage() {
  return (
    <div className="luxury-panel relative z-10 w-full max-w-125 overflow-hidden">
      <Suspense
        fallback={
          <div className="px-8 py-10 text-sm text-neutral-600 dark:text-neutral-300">
            Đang tải...
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
