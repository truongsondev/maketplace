import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Đăng ký – VibeFashion",
  description: "Tạo tài khoản VibeFashion của bạn.",
};

export default function RegisterPage() {
  return (
    <div className="w-full max-w-120 bg-white rounded-2xl shadow-xl border border-border-color overflow-hidden relative z-10">
      {/* Gradient top border */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-primary to-orange-400" />
      <RegisterForm />
    </div>
  );
}
