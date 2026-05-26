"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { useForgotPassword } from "@/hooks/use-forgot-password";

interface ForgotPasswordFormData {
  email: string;
}

export function ForgotPasswordForm() {
  const { mutate: forgotPassword, isPending, isSuccess } = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>();

  const onSubmit = ({ email }: ForgotPasswordFormData) => {
    forgotPassword({ email });
  };

  if (isSuccess) {
    return (
      <div className="px-8 py-14 flex flex-col items-center gap-5 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
          <Mail className="size-8 text-black dark:text-white" />
        </div>
        <h2 className="text-2xl font-black uppercase text-neutral-900 dark:text-white">
          Kiểm tra hộp thư
        </h2>
        <p className="max-w-sm text-neutral-500 dark:text-neutral-400">
          Nếu tài khoản tồn tại, link đặt lại mật khẩu đã được gửi tới email của
          bạn. Link có hiệu lực trong 15 phút.
        </p>
        <Link
          href="/login"
          className="mt-2 text-sm font-bold text-black transition-colors hover:underline dark:text-white"
        >
          Quay lại đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className="px-8 py-10 text-[#222222] dark:text-neutral-100">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-black uppercase text-neutral-900 dark:text-white">
          Quên mật khẩu?
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          Nhập email để nhận link đặt lại mật khẩu.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-sm font-semibold text-neutral-700 dark:text-neutral-200"
          >
            Email
          </label>
          <div className="relative group">
            <input
              {...register("email", {
                required: "Email là bắt buộc",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Email không hợp lệ",
                },
              })}
              id="email"
              type="email"
              autoComplete="email"
              placeholder="ten@example.com"
              className="w-full rounded-sm border border-neutral-300 bg-white px-4 py-3 pr-12 text-neutral-900 placeholder:text-neutral-500 transition-colors focus:border-black focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-white"
            />
            <Mail className="pointer-events-none absolute right-4 top-3.5 size-5 text-neutral-500 transition-colors group-focus-within:text-black dark:group-focus-within:text-white" />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-sm bg-black px-4 py-3.5 font-bold text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
        </button>
      </form>

      <div className="mt-8 border-t border-neutral-200 pt-6 text-center dark:border-neutral-700">
        <Link
          href="/login"
          className="text-sm font-bold text-black transition-colors hover:underline dark:text-white"
        >
          Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
}
