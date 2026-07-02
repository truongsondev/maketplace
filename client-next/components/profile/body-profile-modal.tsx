"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Ruler, Scale, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useBodyProfile, useUpdateBodyProfile } from "@/hooks/use-body-profile";
import { useAuthStore } from "@/stores/auth.store";
import type { ApiErrorResponse } from "@/types/api.types";

const DISMISS_KEY = "bodyProfileModalDismissed";

function toNumber(value: string): number {
  return Number(value.replace(",", "."));
}

function errorMessage(error: unknown, fallback: string): string {
  const apiError = error as ApiErrorResponse;
  return apiError?.error?.message || fallback;
}

export function BodyProfileModal() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data, isLoading } = useBodyProfile();
  const updateBodyProfile = useUpdateBodyProfile();
  const [dismissed, setDismissed] = useState(false);
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === "true");
  }, []);

  const validation = useMemo(() => {
    const parsedAge = Number(age);
    const parsedHeight = toNumber(heightCm);
    const parsedWeight = toNumber(weightKg);

    if (!Number.isInteger(parsedAge) || parsedAge < 13 || parsedAge > 100) {
      return "Tuổi phải là số nguyên từ 13 đến 100.";
    }
    if (
      !Number.isFinite(parsedHeight) ||
      parsedHeight < 100 ||
      parsedHeight > 230
    ) {
      return "Chiều cao phải nằm trong khoảng 100cm đến 230cm.";
    }
    if (
      !Number.isFinite(parsedWeight) ||
      parsedWeight < 30 ||
      parsedWeight > 250
    ) {
      return "Cân nặng phải nằm trong khoảng 30kg đến 250kg.";
    }
    return null;
  }, [age, heightCm, weightKg]);

  const shouldShow =
    isAuthenticated && !isLoading && !data?.isComplete && !dismissed;

  if (!shouldShow) return null;

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  };

  const handleSubmit = async () => {
    if (validation) {
      toast.error(validation);
      return;
    }

    try {
      await updateBodyProfile.mutateAsync({
        age: Number(age),
        heightCm: toNumber(heightCm),
        weightKg: toNumber(weightKg),
      });
      toast.success("Đã lưu thông tin vóc dáng.");
    } catch (error) {
      toast.error(errorMessage(error, "Không lưu được thông tin vóc dáng."));
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cho AURA biết thông tin vóc dáng của bạn gợi ý những sản phẩm phù hợp hơn nhé."
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-sm"
    >
      <div className="w-full max-w-md border border-black/10 bg-[#f7f3ec] p-6 shadow-2xl dark:border-white/10 dark:bg-neutral-950">
        <p className="luxury-eyebrow">Cá nhân hóa gợi ý</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-black dark:text-white">
          Cập nhật thông tin vóc dáng
        </h2>
        <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
          AURA dùng các thông tin này như tín hiệu mềm để gợi ý sản phẩm và kích
          cỡ phù hợp hơn.
        </p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-800 dark:text-neutral-100">
              <UserRound className="size-4" />
              Tuổi
            </span>
            <input
              value={age}
              onChange={(event) => setAge(event.target.value)}
              inputMode="numeric"
              className="h-11 w-full border border-black/15 bg-white px-3 text-sm outline-none focus:border-black dark:border-white/15 dark:bg-neutral-900 dark:focus:border-white"
              placeholder="Ví dụ: 22"
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-800 dark:text-neutral-100">
              <Ruler className="size-4" />
              Chiều cao (cm)
            </span>
            <input
              value={heightCm}
              onChange={(event) => setHeightCm(event.target.value)}
              inputMode="decimal"
              className="h-11 w-full border border-black/15 bg-white px-3 text-sm outline-none focus:border-black dark:border-white/15 dark:bg-neutral-900 dark:focus:border-white"
              placeholder="Ví dụ: 170"
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-800 dark:text-neutral-100">
              <Scale className="size-4" />
              Cân nặng (kg)
            </span>
            <input
              value={weightKg}
              onChange={(event) => setWeightKg(event.target.value)}
              inputMode="decimal"
              className="h-11 w-full border border-black/15 bg-white px-3 text-sm outline-none focus:border-black dark:border-white/15 dark:bg-neutral-900 dark:focus:border-white"
              placeholder="Ví dụ: 62"
            />
          </label>
        </div>

        {validation ? (
          <p className="mt-4 text-xs text-amber-700 dark:text-amber-300">
            {validation}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleDismiss}
            className="h-11 border border-black/15 px-5 text-sm font-semibold text-neutral-700 transition-colors hover:border-black hover:text-black dark:border-white/15 dark:text-neutral-200 dark:hover:border-white dark:hover:text-white"
          >
            Để sau
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={Boolean(validation) || updateBodyProfile.isPending}
            className="luxury-button h-11 px-6 py-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updateBodyProfile.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              "Lưu thông tin"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
