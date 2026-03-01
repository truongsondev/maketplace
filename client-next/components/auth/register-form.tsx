"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { Eye, EyeOff, Mail, Shield, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRegister } from "@/hooks/use-register";
import { useAuthStore } from "@/stores/auth.store";

interface RegisterFormData {
  email: string;
  password: string;
}

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const { mutate: register, isPending, isSuccess } = useRegister();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  const {
    register: field,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const onSubmit = ({ email, password }: RegisterFormData) => {
    register({ email, password });
  };

  /* ── Trạng thái đã gửi email thành công ── */
  if (isSuccess) {
    return (
      <div className="px-8 py-14 flex flex-col items-center gap-5 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
          <Mail className="size-8 text-primary" />
        </div>
        <h2 className="text-2xl font-black text-text-main">
          Kiểm tra hộp thư!
        </h2>
        <p className="text-text-muted max-w-xs">
          Chúng tôi đã gửi link xác nhận tới email của bạn. Vui lòng nhấn vào
          link để hoàn tất đăng ký.
        </p>
        <Link
          href="/login"
          className="mt-2 text-sm font-bold text-primary hover:text-primary-dark transition-colors"
        >
          Quay lại đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className="px-8 py-10 flex flex-col gap-6">
      {/* Heading */}
      <div className="text-center">
        <h1 className="text-3xl font-black tracking-tight text-text-main">
          Tham gia ngay
        </h1>
        <p className="text-text-muted mt-2">
          Tạo tài khoản để nhận ưu đãi độc quyền.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-5"
      >
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="email"
            className="text-sm font-semibold text-text-main"
          >
            Email
          </label>
          <div className="relative group">
            <input
              {...field("email", {
                required: "Email là bắt buộc",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Email không hợp lệ",
                },
              })}
              id="email"
              type="email"
              placeholder="ten@example.com"
              className="w-full rounded-xl border border-border-color bg-background-light px-4 py-3 pr-12 text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
            <Mail className="absolute right-4 top-3.5 size-5 text-text-muted group-focus-within:text-primary transition-colors pointer-events-none" />
          </div>
          {errors.email && (
            <p className="text-red-500 text-xs">{errors.email.message}</p>
          )}
        </div>

        {/* Mật khẩu */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="password"
            className="text-sm font-semibold text-text-main"
          >
            Mật khẩu
          </label>
          <div className="relative group">
            <input
              {...field("password", {
                required: "Mật khẩu là bắt buộc",
                minLength: {
                  value: 6,
                  message: "Mật khẩu phải có ít nhất 6 ký tự",
                },
              })}
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="w-full rounded-xl border border-border-color bg-background-light px-4 py-3 pr-12 text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              className="absolute right-3 top-3.5 text-text-muted hover:text-primary transition-colors flex items-center justify-center"
            >
              {showPassword ? (
                <Eye className="size-5" />
              ) : (
                <EyeOff className="size-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs">{errors.password.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="mt-2 flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3.5 text-base font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary-dark hover:shadow-primary/50 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Đang tạo tài khoản…" : "Tạo tài khoản"}
        </button>
      </form>

      {/* Trust badges */}
      <div className="flex justify-center gap-6 opacity-60 hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-1.5 text-text-muted text-xs font-bold tracking-widest uppercase">
          <Shield className="size-4" />
          Bảo mật
        </div>
        <div className="flex items-center gap-1.5 text-text-muted text-xs font-bold tracking-widest uppercase">
          <Lock className="size-4" />
          Mã hoá
        </div>
      </div>

      {/* Link đăng nhập */}
      <div className="flex items-center justify-center gap-2 pt-2 border-t border-border-color">
        <p className="text-sm text-text-muted">Đã có tài khoản?</p>
        <Link
          href="/login"
          className="text-sm font-bold text-primary hover:text-primary-dark transition-colors"
        >
          Đăng nhập
        </Link>
      </div>
    </div>
  );
}
