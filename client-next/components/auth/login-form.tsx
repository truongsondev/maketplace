"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { SocialLoginButtons } from "./social-login-buttons";
import { useLogin } from "@/hooks/use-login";
import { useAuthStore } from "@/stores/auth.store";

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

function resolveSafeRedirect(redirect?: string): string {
  if (!redirect) return "/";
  if (!redirect.startsWith("/") || redirect.startsWith("//")) return "/";
  if (redirect.startsWith("/login")) return "/";
  return redirect;
}

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const redirectAfterLogin = searchParams.get("redirect") ?? undefined;
  const { mutate: login, isPending } = useLogin(redirectAfterLogin);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(resolveSafeRedirect(redirectAfterLogin));
    }
  }, [isAuthenticated, router, redirectAfterLogin]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = ({ email, password }: LoginFormData) => {
    login({ email, password });
  };

  return (
    <div className="px-8 py-10 text-[#222222] dark:text-neutral-100">
      {/* Heading */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black uppercase text-neutral-900 dark:text-white mb-2">
          Chào mừng trở lại!
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          Vui lòng nhập thông tin để đăng nhập.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Email / Phone */}
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-neutral-700 dark:text-neutral-200 text-sm font-semibold"
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
            className="w-full rounded-sm border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-neutral-700 dark:text-neutral-200 text-sm font-semibold"
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
              className="w-full rounded-sm border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3 pr-12 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              className="absolute right-3 text-neutral-500 hover:text-black dark:hover:text-white transition-colors flex items-center justify-center"
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
              className="h-5 w-5 rounded border-neutral-300 bg-white text-black focus:ring-black/20 focus:ring-offset-0 checked:bg-black checked:border-black transition-all cursor-pointer"
            />
            <span className="text-sm text-neutral-700 dark:text-neutral-200 font-medium">
              Ghi nhớ đăng nhập
            </span>
          </label>
          <Link
            href="/forgot-password"
            className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:text-black dark:hover:text-white transition-colors"
          >
            Quên mật khẩu?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-black hover:bg-neutral-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-sm shadow-sm transition-all active:scale-[0.98]"
        >
          {isPending ? "Đang đăng nhập…" : "Đăng nhập"}
        </button>
      </form>

      {/* Divider */}
      <div className="relative flex items-center py-6">
        <div className="grow border-t border-neutral-200 dark:border-neutral-700" />
        <span className="mx-4 shrink-0 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          Hoặc tiếp tục với
        </span>
        <div className="grow border-t border-neutral-200 dark:border-neutral-700" />
      </div>

      {/* Social Login */}
      <SocialLoginButtons redirectAfterLogin={redirectAfterLogin} />

      {/* Sign Up Link */}
      <div className="mt-8 text-center">
        <p className="text-neutral-500 text-sm">
          Chưa có tài khoản?{" "}
          <Link
            href="/register"
            className="text-black dark:text-white font-bold hover:underline"
          >
            Tạo tài khoản
          </Link>
        </p>
      </div>
    </div>
  );
}
