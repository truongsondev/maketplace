"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { SocialLoginButtons } from "./social-login-buttons";
import { useLogin } from "@/hooks/use-login";
import { useAuthStore } from "@/stores/auth.store";

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const { mutate: login, isPending } = useLogin();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = ({ email, password }: LoginFormData) => {
    login({ email, password });
  };

  return (
    <div className="px-8 py-10">
      {/* Heading */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-text-main mb-2">
          Chào mừng trở lại!
        </h1>
        <p className="text-text-muted">Vui lòng nhập thông tin để đăng nhập.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Email / Phone */}
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-text-main text-sm font-semibold"
          >
            Email hoặc Số điện thoại
          </label>
          <input
            {...register("email", {
              required: "Email hoặc số điện thoại là bắt buộc",
            })}
            id="email"
            type="text"
            placeholder="Nhập email hoặc số điện thoại"
            className="w-full rounded-lg border border-border-color bg-background-light px-4 py-3 text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-text-main text-sm font-semibold"
          >
            Mật khẩu
          </label>
          <div className="relative flex items-center">
            <input
              {...register("password", {
                required: "Mật khẩu là bắt buộc",
                minLength: {
                  value: 6,
                  message: "Mật khẩu phải có ít nhất 6 ký tự",
                },
              })}
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Nhập mật khẩu"
              className="w-full rounded-lg border border-border-color bg-background-light px-4 py-3 pr-12 text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              className="absolute right-3 text-text-muted hover:text-primary transition-colors flex items-center justify-center"
            >
              {showPassword ? (
                <Eye className="size-5" />
              ) : (
                <EyeOff className="size-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Remember Me + Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              {...register("rememberMe")}
              type="checkbox"
              className="h-5 w-5 rounded border-border-color bg-white text-primary focus:ring-primary/20 focus:ring-offset-0 checked:bg-primary checked:border-primary transition-all cursor-pointer"
            />
            <span className="text-sm text-text-main font-medium">
              Ghi nhớ đăng nhập
            </span>
          </label>
          <Link
            href="/forgot-password"
            className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
          >
            Quên mật khẩu?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-primary hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-[0.98]"
        >
          {isPending ? "Đang đăng nhập…" : "Đăng nhập"}
        </button>
      </form>

      {/* Divider */}
      <div className="relative flex items-center py-6">
        <div className="grow border-t border-border-color" />
        <span className="mx-4 shrink-0 text-xs font-semibold text-text-muted uppercase tracking-wider">
          Hoặc tiếp tục với
        </span>
        <div className="grow border-t border-border-color" />
      </div>

      {/* Social Login */}
      <SocialLoginButtons />

      {/* Sign Up Link */}
      <div className="mt-8 text-center">
        <p className="text-text-muted text-sm">
          Chưa có tài khoản?{" "}
          <Link
            href="/register"
            className="text-primary font-bold hover:underline"
          >
            Tạo tài khoản
          </Link>
        </p>
      </div>
    </div>
  );
}
