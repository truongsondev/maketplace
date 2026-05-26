import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Quên mật khẩu - VibeFashion",
  description: "Nhận link đặt lại mật khẩu cho tài khoản VibeFashion.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="luxury-panel relative z-10 w-full max-w-125 overflow-hidden">
      <ForgotPasswordForm />
    </div>
  );
}
