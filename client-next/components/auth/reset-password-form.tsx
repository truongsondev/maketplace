"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { useResetPassword } from "@/hooks/use-reset-password";

interface ResetPasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

export function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { mutate: resetPassword, isPending } = useResetPassword();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>();
  const newPasswordValue = useWatch({ control, name: "newPassword" });

  const onSubmit = ({ newPassword }: ResetPasswordFormData) => {
    if (!token) return;
    resetPassword({ token, newPassword });
  };

  if (!token) {
    return (
      <div className="px-8 py-14 flex flex-col items-center gap-5 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
          <Lock className="size-8 text-black dark:text-white" />
        </div>
        <h2 className="text-2xl font-black uppercase text-neutral-900 dark:text-white">
          Link không hợp lệ
        </h2>
        <p className="max-w-sm text-neutral-500 dark:text-neutral-400">
          Link đặt lại mật khẩu thiếu mã xác thực. Vui lòng yêu cầu link mới.
        </p>
        <Link
          href="/forgot-password"
          className="mt-2 text-sm font-bold text-black transition-colors hover:underline dark:text-white"
        >
          Gửi lại link
        </Link>
      </div>
    );
  }

  return (
    <div className="px-8 py-10 text-[#222222] dark:text-neutral-100">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-black uppercase text-neutral-900 dark:text-white">
          Đặt lại mật khẩu
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          Chọn mật khẩu mới cho tài khoản của bạn.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div className="space-y-2">
          <label
            htmlFor="newPassword"
            className="text-sm font-semibold text-neutral-700 dark:text-neutral-200"
          >
            Mật khẩu mới
          </label>
          <div className="relative flex items-center">
            <input
              {...register("newPassword", {
                required: "Mật khẩu mới là bắt buộc",
                minLength: {
                  value: 6,
                  message: "Mật khẩu phải có ít nhất 6 ký tự",
                },
              })}
              id="newPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Nhập mật khẩu mới"
              className="w-full rounded-sm border border-neutral-300 bg-white px-4 py-3 pr-12 text-neutral-900 placeholder:text-neutral-500 transition-colors focus:border-black focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-white"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              className="absolute right-3 flex items-center justify-center text-neutral-500 transition-colors hover:text-black dark:hover:text-white"
            >
              {showPassword ? (
                <Eye className="size-5" />
              ) : (
                <EyeOff className="size-5" />
              )}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-xs text-red-500">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="confirmPassword"
            className="text-sm font-semibold text-neutral-700 dark:text-neutral-200"
          >
            Nhập lại mật khẩu
          </label>
          <input
            {...register("confirmPassword", {
              required: "Vui lòng nhập lại mật khẩu",
              validate: (value) =>
                value === newPasswordValue || "Mật khẩu nhập lại không khớp",
            })}
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Nhập lại mật khẩu mới"
            className="w-full rounded-sm border border-neutral-300 bg-white px-4 py-3 text-neutral-900 placeholder:text-neutral-500 transition-colors focus:border-black focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-white"
          />
          {errors.confirmPassword && (
            <p className="text-xs text-red-500">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-sm bg-black px-4 py-3.5 font-bold text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
        </button>
      </form>
    </div>
  );
}
