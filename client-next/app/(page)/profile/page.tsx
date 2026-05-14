"use client";

import { useMemo, useState } from "react";
import { Heart, Mail, PackageCheck, ShieldCheck, User } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";

interface StoredAuthState {
  state?: {
    user?: {
      email?: string | null;
      role?: string | null;
      status?: string | null;
    } | null;
    profile?: {
      fullName?: string | null;
    } | null;
  };
}

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [storedState] = useState<StoredAuthState | null>(() => {
    if (typeof window === "undefined") return null;

    try {
      const raw = window.localStorage.getItem("auth-session");
      if (!raw) return null;
      return JSON.parse(raw) as StoredAuthState;
    } catch {
      return null;
    }
  });

  const fullName = useMemo(() => {
    return (
      profile?.fullName?.trim() ||
      storedState?.state?.profile?.fullName?.trim() ||
      "Chưa cập nhật"
    );
  }, [profile?.fullName, storedState?.state?.profile?.fullName]);

  const email = useMemo(() => {
    return (
      user?.email?.trim() || storedState?.state?.user?.email?.trim() || "-"
    );
  }, [storedState?.state?.user?.email, user?.email]);

  const status = useMemo(() => {
    return user?.status || storedState?.state?.user?.status || "unknown";
  }, [storedState?.state?.user?.status, user?.status]);

  const role = useMemo(() => {
    return user?.role || storedState?.state?.user?.role || "buyer";
  }, [storedState?.state?.user?.role, user?.role]);

  return (
    <main className="luxury-page min-h-screen px-4 py-16 sm:px-6 lg:px-8">
      <header className="mx-auto mb-10 w-full max-w-5xl">
        <p className="luxury-eyebrow">Private client space</p>
        <h1 className="luxury-title mt-4">Không gian thành viên</h1>
        <p className="luxury-copy mt-4 max-w-2xl">
          Theo dõi hồ sơ, lịch sử mua sắm và những lựa chọn bạn đã lưu trong một
          không gian yên tĩnh hơn.
        </p>
      </header>

      {!isAuthenticated && (
        <div className="luxury-panel mx-auto mb-6 w-full max-w-5xl px-4 py-3 text-sm text-neutral-700 dark:text-neutral-200">
          Bạn chưa đăng nhập. Dữ liệu hiện tại được đọc từ phiên lưu trong trình
          duyệt nếu có.
        </div>
      )}

      <section className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-px bg-black/10 dark:bg-white/10 md:grid-cols-2">
        <article className="bg-[#f7f3ec] p-6 dark:bg-neutral-950">
          <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
            <User className="size-4" />
            <span className="text-xs uppercase tracking-wide">Họ tên</span>
          </div>
          <p className="mt-3 text-lg font-semibold text-neutral-900 dark:text-white">
            {fullName}
          </p>
        </article>

        <article className="bg-[#f7f3ec] p-6 dark:bg-neutral-950">
          <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
            <Mail className="size-4" />
            <span className="text-xs uppercase tracking-wide">Email</span>
          </div>
          <p className="mt-3 text-lg font-semibold text-neutral-900 dark:text-white">
            {email}
          </p>
        </article>

        <article className="bg-[#f7f3ec] p-6 dark:bg-neutral-950">
          <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
            <ShieldCheck className="size-4" />
            <span className="text-xs uppercase tracking-wide">Trạng thái</span>
          </div>
          <p className="mt-3 text-lg font-semibold text-neutral-900 dark:text-white capitalize">
            {status}
          </p>
        </article>

        <article className="bg-[#f7f3ec] p-6 dark:bg-neutral-950">
          <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
            <ShieldCheck className="size-4" />
            <span className="text-xs uppercase tracking-wide">Vai trò</span>
          </div>
          <p className="mt-3 text-lg font-semibold text-neutral-900 dark:text-white uppercase">
            {role}
          </p>
        </article>
      </section>

      <section className="mx-auto mt-10 grid w-full max-w-5xl gap-px bg-black/10 dark:bg-white/10 md:grid-cols-3">
        {[
          {
            icon: PackageCheck,
            title: "Order history",
            copy: "Xem lại các đơn hàng và trạng thái xử lý.",
            action: "Theo dõi đơn",
          },
          {
            icon: Heart,
            title: "Wishlist edit",
            copy: "Quay lại những item đã lưu cho lần phối tiếp theo.",
            action: "Mở wishlist",
          },
          {
            icon: ShieldCheck,
            title: "Personal styling",
            copy: "Dữ liệu tương tác giúp gợi ý sản phẩm riêng cho bạn.",
            action: "Cập nhật gu",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <article
              key={item.title}
              className="bg-[#f7f3ec] p-6 dark:bg-neutral-950"
            >
              <Icon className="size-4 text-neutral-500" />
              <h2 className="mt-5 text-lg font-semibold uppercase tracking-[-0.02em] text-neutral-950 dark:text-white">
                {item.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                {item.copy}
              </p>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-700 dark:text-neutral-300">
                {item.action}
              </p>
            </article>
          );
        })}
      </section>
    </main>
  );
}
