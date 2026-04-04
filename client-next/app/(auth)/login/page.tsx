import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Đăng nhập – VibeFashion",
  description: "Đăng nhập vào tài khoản VibeFashion của bạn.",
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-120 bg-white rounded-sm shadow-sm border border-neutral-200 overflow-hidden relative z-10 dark:bg-neutral-900 dark:border-neutral-800">
      <LoginForm />
    </div>
  );
}
