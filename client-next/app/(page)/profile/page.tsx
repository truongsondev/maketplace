"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Gift,
  Home,
  Loader2,
  Mail,
  MapPin,
  Medal,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { useBodyProfile, useUpdateBodyProfile } from "@/hooks/use-body-profile";
import { addressService } from "@/services/address.service";
import { getMyLoyalty } from "@/services/loyalty.service";
import { userService } from "@/services/user.service";
import type { ApiErrorResponse } from "@/types/api.types";

interface StoredAuthState {
  state?: {
    user?: {
      email?: string | null;
      role?: string | null;
      status?: string | null;
    } | null;
    profile?: {
      birthday?: string | null;
    } | null;
  };
}

function getStoredAuthState(): StoredAuthState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem("auth-session");
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuthState;
  } catch {
    return null;
  }
}

function getDateFromBirthday(birthday?: string | null): string {
  if (!birthday) return "";

  const date = birthday.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "";
}

function formatBirthday(date: string) {
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;
  return `${day}/${month}/${year}`;
}

function isRealDateValue(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return false;

  const parsedDate = new Date(Date.UTC(year, month - 1, day));
  return (
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  const apiError = error as ApiErrorResponse;
  return apiError?.error?.message || fallback;
}

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [storedState] = useState<StoredAuthState | null>(getStoredAuthState);
  const [birthdayDraft, setBirthdayDraft] = useState<string | null>(null);
  const [birthdayMessage, setBirthdayMessage] = useState("");

  const accountQuery = useQuery({
    queryKey: ["users", "me"],
    queryFn: () => userService.getMe(),
    enabled: isAuthenticated,
    retry: false,
  });
  const bodyProfileQuery = useBodyProfile();
  const updateBodyProfile = useUpdateBodyProfile();
  const loyaltyQuery = useQuery({
    queryKey: ["loyalty", "me"],
    queryFn: getMyLoyalty,
    enabled: isAuthenticated,
  });
  const addressesQuery = useQuery({
    queryKey: ["addresses", "me"],
    queryFn: () => addressService.getMyAddresses(),
    enabled: isAuthenticated,
    retry: false,
  });

  const storedEmail = useMemo(() => {
    return user?.email?.trim() || storedState?.state?.user?.email?.trim() || "";
  }, [storedState?.state?.user?.email, user?.email]);
  const email = accountQuery.data?.email?.trim() || storedEmail;
  const emailLabel = accountQuery.isLoading
    ? storedEmail || "Đang tải email..."
    : email || "Chưa có email";

  const persistedBirthday = useMemo(() => {
    return (
      getDateFromBirthday(bodyProfileQuery.data?.birthday) ||
      getDateFromBirthday(profile?.birthday) ||
      getDateFromBirthday(storedState?.state?.profile?.birthday)
    );
  }, [
    bodyProfileQuery.data?.birthday,
    profile?.birthday,
    storedState?.state?.profile?.birthday,
  ]);
  const birthdayInput = birthdayDraft ?? persistedBirthday;
  const hasLockedBirthday = Boolean(persistedBirthday);

  const loyalty = loyaltyQuery.data;
  const tierLabel = loyalty?.tierLabel ?? loyalty?.tier ?? "Thành viên";
  const lifetimePoints = loyalty?.lifetimePoints ?? 0;
  const requiredPoints = loyalty?.nextTier?.requiredPoints ?? lifetimePoints;
  const pointsToNextTier = loyalty?.pointsToNextTier ?? 0;
  const tierProgress = useMemo(() => {
    if (!loyalty?.nextTier) return 100;
    const required = loyalty.nextTier.requiredPoints || 1;
    return Math.max(
      0,
      Math.min(100, Math.round((lifetimePoints / required) * 100)),
    );
  }, [lifetimePoints, loyalty?.nextTier]);

  const currentYear = new Date().getFullYear();
  const minimumBirthday = `${currentYear - 100}-01-01`;
  const maximumBirthday = `${currentYear - 13}-12-31`;
  const birthdayIsValid =
    /^\d{4}-\d{2}-\d{2}$/.test(birthdayInput) &&
    isRealDateValue(birthdayInput) &&
    birthdayInput >= minimumBirthday &&
    birthdayInput <= maximumBirthday;

  async function handleSaveBirthday(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (hasLockedBirthday) {
      setBirthdayMessage("Ngày sinh đã được lưu và không thể cập nhật lại.");
      return;
    }

    if (!birthdayIsValid) {
      setBirthdayMessage(
        `Vui lòng nhập ngày sinh từ ${formatBirthday(minimumBirthday)} đến ${formatBirthday(maximumBirthday)}.`,
      );
      return;
    }

    try {
      await updateBodyProfile.mutateAsync({ birthday: birthdayInput });
      setBirthdayDraft(null);
      setBirthdayMessage(
        "Đã lưu ngày sinh. Voucher sinh nhật sẽ được xét vào đúng ngày sinh nhật hằng năm.",
      );
    } catch (error) {
      setBirthdayMessage(
        getErrorMessage(error, "Không lưu được ngày sinh. Vui lòng thử lại."),
      );
    }
  }

  return (
    <main className="luxury-page min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 border-b border-black/10 pb-6 dark:border-white/10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="luxury-eyebrow">Hồ sơ thành viên</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-neutral-950 dark:text-white sm:text-4xl">
              Tài khoản của tôi
            </h1>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-600 dark:text-neutral-300">
            <span className="inline-flex items-center gap-2 rounded-md border border-black/10 bg-white/60 px-3 py-2 dark:border-white/10 dark:bg-white/5">
              <ShieldCheck className="size-4" />
              {tierLabel}
            </span>
            <span className="inline-flex items-center gap-2 rounded-md border border-black/10 bg-white/60 px-3 py-2 dark:border-white/10 dark:bg-white/5">
              <Sparkles className="size-4" />
              {loyalty?.balance ?? 0} điểm
            </span>
          </div>
        </header>

        {!isAuthenticated ? (
          <section className="mb-5 rounded-md border border-amber-300/50 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">
            Bạn chưa đăng nhập. Một vài thông tin có thể được đọc từ phiên đã
            lưu trên trình duyệt.
          </section>
        ) : null}

        <section className="mb-4 grid gap-3 md:grid-cols-3">
          <article className="luxury-panel p-4">
            <div className="flex items-center gap-3 text-neutral-500 dark:text-neutral-400">
              <Mail className="size-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.16em]">
                Email tài khoản
              </p>
            </div>
            <p className="mt-3 break-all text-base font-semibold text-neutral-950 dark:text-white">
              {emailLabel}
            </p>
          </article>

          <article className="luxury-panel p-4">
            <div className="flex items-center gap-3 text-neutral-500 dark:text-neutral-400">
              <Medal className="size-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.16em]">
                Hạng hiện tại
              </p>
            </div>
            <p className="mt-3 text-base font-semibold text-neutral-950 dark:text-white">
              {loyaltyQuery.isLoading ? "Đang tải..." : tierLabel}
            </p>
          </article>

          <article className="luxury-panel p-4">
            <div className="flex items-center gap-3 text-neutral-500 dark:text-neutral-400">
              <Gift className="size-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.16em]">
                Sinh nhật
              </p>
            </div>
            <p className="mt-3 text-base font-semibold text-neutral-950 dark:text-white">
              {hasLockedBirthday
                ? formatBirthday(persistedBirthday)
                : "Chưa thiết lập"}
            </p>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="luxury-panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 text-neutral-500 dark:text-neutral-400">
                  <CalendarDays className="size-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.16em]">
                    Ngày sinh người dùng
                  </p>
                </div>
                <h2 className="mt-3 text-xl font-semibold text-neutral-950 dark:text-white">
                  {hasLockedBirthday ? "Đã khóa ngày sinh" : "Lưu ngày sinh"}
                </h2>
              </div>
              <span className="rounded-md border border-black/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-700 dark:border-white/10 dark:text-neutral-200">
                {hasLockedBirthday ? "Đã lưu" : "Một lần"}
              </span>
            </div>

            <form className="mt-5" onSubmit={handleSaveBirthday}>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  className="luxury-field h-12 w-full rounded-md"
                  disabled={hasLockedBirthday || updateBodyProfile.isPending}
                  max={maximumBirthday}
                  min={minimumBirthday}
                  onChange={(event) => {
                    setBirthdayDraft(event.target.value);
                    setBirthdayMessage("");
                  }}
                  type="date"
                  value={birthdayInput}
                />
                <button
                  className="luxury-button h-12 rounded-md px-5 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={
                    hasLockedBirthday ||
                    !birthdayInput.trim() ||
                    updateBodyProfile.isPending
                  }
                  type="submit"
                >
                  {updateBodyProfile.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Đang lưu
                    </>
                  ) : (
                    "Lưu ngày sinh"
                  )}
                </button>
              </div>
            </form>

            <p className="mt-4 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              {hasLockedBirthday
                ? "Ngày sinh đã được lưu cố định để hệ thống xét voucher sinh nhật đúng tài khoản."
                : "Ngày sinh chỉ được lưu một lần. Hệ thống sẽ dùng thông tin này để xét voucher sinh nhật hằng năm."}
            </p>
            {birthdayMessage ? (
              <p className="mt-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {birthdayMessage}
              </p>
            ) : null}
          </article>

          <article className="luxury-panel p-5">
            <div className="flex items-center gap-3 text-neutral-500 dark:text-neutral-400">
              <MapPin className="size-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.16em]">
                Danh sách địa chỉ
              </p>
            </div>

            <div className="mt-5 grid gap-3">
              {addressesQuery.isLoading ? (
                <div className="space-y-3">
                  <div className="luxury-skeleton h-24 rounded-md" />
                  <div className="luxury-skeleton h-24 rounded-md" />
                </div>
              ) : addressesQuery.data?.length ? (
                addressesQuery.data.map((address) => (
                  <section
                    className="rounded-md border border-black/10 bg-white/55 p-4 dark:border-white/10 dark:bg-white/5"
                    key={address.id}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Home className="size-4 text-neutral-500" />
                        <p className="font-semibold text-neutral-950 dark:text-white">
                          {address.recipient}
                        </p>
                      </div>
                      {address.isDefault ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-black px-2.5 py-1 text-xs font-semibold text-white dark:bg-white dark:text-black">
                          <CheckCircle2 className="size-3.5" />
                          Mặc định
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                      {address.phone}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                      {address.addressLine}, {address.ward}, {address.district},{" "}
                      {address.city}
                    </p>
                  </section>
                ))
              ) : (
                <div className="rounded-md border border-dashed border-black/15 p-6 text-sm text-neutral-500 dark:border-white/15 dark:text-neutral-400">
                  Chưa có địa chỉ nào được lưu.
                </div>
              )}
            </div>
          </article>
        </section>

        <section className="luxury-panel mt-4 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 text-neutral-500 dark:text-neutral-400">
              <Medal className="size-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.16em]">
                Tiến trình hạng thành viên
              </p>
            </div>
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
              {loyalty?.nextTier
                ? `Còn ${pointsToNextTier} điểm để lên hạng ${loyalty.nextTier.label}.`
                : "Bạn đã đạt hạng cao nhất hiện tại."}
            </p>
          </div>
          <div className="mt-5">
            <div className="flex flex-wrap justify-between gap-3 text-sm text-neutral-600 dark:text-neutral-300">
              <span>{lifetimePoints} điểm tích lũy</span>
              <span>
                {loyalty?.nextTier
                  ? `Mốc ${loyalty.nextTier.label}: ${requiredPoints} điểm`
                  : "Hạng cao nhất"}
              </span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
              <div
                className="h-full rounded-full bg-neutral-950 transition-all dark:bg-white"
                style={{ width: `${tierProgress}%` }}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
