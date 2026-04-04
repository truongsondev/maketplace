import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Đăng nhập – VibeFashion",
  description: "Đăng nhập vào tài khoản VibeFashion của bạn.",
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-120 bg-white rounded-sm shadow-sm border border-neutral-200 overflow-hidden relative z-10 dark:bg-neutral-900 dark:border-neutral-800">
      <Suspense
        fallback={
          <div className="px-8 py-10 text-sm text-neutral-600 dark:text-neutral-300">
            Đang tải...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
