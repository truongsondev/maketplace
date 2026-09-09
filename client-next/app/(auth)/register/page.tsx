import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Đăng ký – VibeFashion",
  description: "Tạo tài khoản VibeFashion của bạn.",
};

export default function RegisterPage() {
  return (
    <div className="luxury-panel relative z-10 w-full max-w-125 overflow-hidden">
      <RegisterForm />
    </div>
  );
}
