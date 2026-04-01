"use client";

import { useEffect, useMemo, useState } from "react";
import { User, Mail, ShieldCheck } from "lucide-react";
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
  const [storedState, setStoredState] = useState<StoredAuthState | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem("auth-session");
      if (!raw) return;
      setStoredState(JSON.parse(raw) as StoredAuthState);
    } catch {
      setStoredState(null);
    }
  }, []);

  const fullName = useMemo(() => {
    return (
      profile?.fullName?.trim() ||
      storedState?.state?.profile?.fullName?.trim() ||
      "Chưa cập nhật"
    );
  }, [profile?.fullName, storedState?.state?.profile?.fullName]);

  const email = useMemo(() => {
    return user?.email?.trim() || storedState?.state?.user?.email?.trim() || "-";
  }, [storedState?.state?.user?.email, user?.email]);

  const status = useMemo(() => {
    return user?.status || storedState?.state?.user?.status || "unknown";
  }, [storedState?.state?.user?.status, user?.status]);

  const role = useMemo(() => {
    return user?.role || storedState?.state?.user?.role || "buyer";
  }, [storedState?.state?.user?.role, user?.role]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Hồ sơ tài khoản
        </h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Quản lý thông tin cá nhân và trạng thái tài khoản của bạn.
        </p>
      </header>

      {!isAuthenticated && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          Bạn chưa đăng nhập. Dữ liệu hiện tại được đọc từ phiên lưu trong trình duyệt nếu có.
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
          <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
            <User className="size-4" />
            <span className="text-xs uppercase tracking-wide">Họ tên</span>
          </div>
          <p className="mt-3 text-lg font-semibold text-neutral-900 dark:text-white">
            {fullName}
          </p>
        </article>

        <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
          <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
            <Mail className="size-4" />
            <span className="text-xs uppercase tracking-wide">Email</span>
          </div>
          <p className="mt-3 text-lg font-semibold text-neutral-900 dark:text-white">
            {email}
          </p>
        </article>

        <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
          <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
            <ShieldCheck className="size-4" />
            <span className="text-xs uppercase tracking-wide">Trạng thái</span>
          </div>
          <p className="mt-3 text-lg font-semibold text-neutral-900 dark:text-white capitalize">
            {status}
          </p>
        </article>

        <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
          <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
            <ShieldCheck className="size-4" />
            <span className="text-xs uppercase tracking-wide">Vai trò</span>
          </div>
          <p className="mt-3 text-lg font-semibold text-neutral-900 dark:text-white uppercase">
            {role}
          </p>
        </article>
      </section>
    </main>
  );
}
