import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Đăng ký – VibeFashion",
  description: "Tạo tài khoản VibeFashion của bạn.",
};

export default function RegisterPage() {
  return (
    <div className="w-full max-w-120 bg-white rounded-sm shadow-sm border border-neutral-200 overflow-hidden relative z-10 dark:bg-neutral-900 dark:border-neutral-800">
      <RegisterForm />
    </div>
  );
}
