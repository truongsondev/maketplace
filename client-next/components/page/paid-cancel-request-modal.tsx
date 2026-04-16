"use client";

import { useEffect, useMemo, useState } from "react";
import type { CancelReasonCode } from "@/types/order.types";

export interface PaidCancelRequestPayload {
  reasonCode: CancelReasonCode;
  reasonText?: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
}

const REASON_OPTIONS: Array<{ value: CancelReasonCode; label: string }> = [
  { value: "NO_LONGER_NEEDED", label: "Không muốn mua nữa" },
  { value: "BUY_OTHER_ITEM", label: "Mua hàng khác" },
  { value: "FOUND_CHEAPER", label: "Có chỗ khác rẻ hơn" },
  { value: "OTHER", label: "Khác" },
];

function reasonLabel(reasonCode: CancelReasonCode): string {
  const found = REASON_OPTIONS.find((item) => item.value === reasonCode);
  return found?.label ?? reasonCode;
}

function maskAccount(accountNumber: string): string {
  if (!accountNumber) {
    return "";
  }
  if (accountNumber.length <= 4) {
    return accountNumber;
  }
  return `${"*".repeat(Math.max(0, accountNumber.length - 4))}${accountNumber.slice(-4)}`;
}

export function PaidCancelRequestModal({
  open,
  orderLabel,
  isSubmitting,
  onClose,
  onConfirm,
}: {
  open: boolean;
  orderLabel: string;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (payload: PaidCancelRequestPayload) => Promise<void>;
}) {
  const [reasonCode, setReasonCode] =
    useState<CancelReasonCode>("NO_LONGER_NEEDED");
  const [reasonText, setReasonText] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmStep, setConfirmStep] = useState(false);

  useEffect(() => {
    if (!open) {
      setReasonCode("NO_LONGER_NEEDED");
      setReasonText("");
      setBankAccountName("");
      setBankAccountNumber("");
      setBankName("");
      setError(null);
      setConfirmStep(false);
    }
  }, [open]);

  const payload = useMemo(() => {
    const trimmedReasonText = reasonText.trim();
    return {
      reasonCode,
      reasonText: trimmedReasonText ? trimmedReasonText : undefined,
      bankAccountName: bankAccountName.trim(),
      bankAccountNumber: bankAccountNumber.trim(),
      bankName: bankName.trim(),
    } satisfies PaidCancelRequestPayload;
  }, [reasonCode, reasonText, bankAccountName, bankAccountNumber, bankName]);

  if (!open) {
    return null;
  }

  const validate = (): boolean => {
    if (reasonCode === "OTHER" && !payload.reasonText) {
      setError("Vui lòng nhập lý do cụ thể khi chọn 'Khác'.");
      return false;
    }

    if (
      !payload.bankAccountName ||
      !payload.bankAccountNumber ||
      !payload.bankName
    ) {
      setError(
        "Vui lòng nhập đầy đủ tên chủ tài khoản, số tài khoản và ngân hàng.",
      );
      return false;
    }

    setError(null);
    return true;
  };

  const handleContinue = () => {
    if (!validate()) {
      return;
    }

    setConfirmStep(true);
  };

  const handleSubmit = async () => {
    if (!validate()) {
      setConfirmStep(false);
      return;
    }

    await onConfirm(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-[0_24px_70px_-30px_rgba(0,0,0,0.65)] dark:border-neutral-800 dark:bg-black">
        <div className="border-b border-neutral-200 bg-white px-6 py-5 dark:border-neutral-800 dark:bg-black">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
            Yêu cầu hủy
          </p>
          <h3 className="mt-2 text-xl font-semibold text-neutral-900 dark:text-white">
            Yêu cầu hủy đơn đã thanh toán
          </h3>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
            Đơn: {orderLabel}
          </p>
        </div>

        <div className="px-6 py-5">
          <div className="mb-5 flex items-center gap-2 text-xs font-semibold">
            <span
              className={`inline-flex rounded-full px-3 py-1 ${
                !confirmStep
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300"
              }`}
            >
              1. Nhập thông tin
            </span>
            <span className="text-neutral-400">/</span>
            <span
              className={`inline-flex rounded-full px-3 py-1 ${
                confirmStep
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300"
              }`}
            >
              2. Xác nhận
            </span>
          </div>

          {!confirmStep ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  Lý do hủy
                </label>
                <select
                  value={reasonCode}
                  onChange={(e) =>
                    setReasonCode(e.target.value as CancelReasonCode)
                  }
                  className="h-11 w-full rounded-sm border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none transition focus:ring-2 focus:ring-black/10 dark:border-neutral-800 dark:bg-black dark:text-white dark:focus:ring-white/15"
                >
                  {REASON_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {reasonCode === "OTHER" ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                    Lý do khác
                  </label>
                  <textarea
                    value={reasonText}
                    onChange={(e) => setReasonText(e.target.value)}
                    rows={3}
                    className="w-full rounded-sm border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:ring-2 focus:ring-black/10 dark:border-neutral-800 dark:bg-black dark:text-white dark:focus:ring-white/15"
                    placeholder="Nhập lý do cụ thể"
                  />
                </div>
              ) : null}

              <div className="rounded-sm border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Thông tin nhận hoàn tiền
                </p>
                <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">
                  Điền chính xác để tránh thất bại khi chuyển khoản hoàn tiền.
                </p>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                      Tên chủ tài khoản
                    </label>
                    <input
                      value={bankAccountName}
                      onChange={(e) => setBankAccountName(e.target.value)}
                      className="h-11 w-full rounded-sm border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none transition focus:ring-2 focus:ring-black/10 dark:border-neutral-800 dark:bg-black dark:text-white dark:focus:ring-white/15"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                      Số tài khoản
                    </label>
                    <input
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      className="h-11 w-full rounded-sm border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none transition focus:ring-2 focus:ring-black/10 dark:border-neutral-800 dark:bg-black dark:text-white dark:focus:ring-white/15"
                      placeholder="0123456789"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                      Ngân hàng
                    </label>
                    <input
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="h-11 w-full rounded-sm border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none transition focus:ring-2 focus:ring-black/10 dark:border-neutral-800 dark:bg-black dark:text-white dark:focus:ring-white/15"
                      placeholder="Vietcombank"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-sm border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100">
              <p className="font-semibold">
                Vui lòng xác nhận lại thông tin nhận hoàn tiền:
              </p>
              <div className="mt-3 space-y-2 rounded-sm border border-neutral-200 bg-white p-3 text-neutral-800 dark:border-neutral-800 dark:bg-black dark:text-neutral-100">
                <p>Lý do: {reasonLabel(payload.reasonCode)}</p>
                {payload.reasonCode === "OTHER" && payload.reasonText ? (
                  <p>Chi tiết: {payload.reasonText}</p>
                ) : null}
                <p>Tên chủ tài khoản: {payload.bankAccountName}</p>
                <p>Số tài khoản: {maskAccount(payload.bankAccountNumber)}</p>
                <p>Ngân hàng: {payload.bankName}</p>
              </div>
              <p className="mt-3 rounded-sm border border-neutral-200 bg-white p-3 font-medium text-neutral-900 dark:border-neutral-800 dark:bg-black dark:text-neutral-100">
                Chúng tôi sẽ không chịu trách nhiệm khi có sự sai sót thông tin
                ở phía bạn.
              </p>
            </div>
          )}

          {error ? (
            <p className="mt-3 rounded-sm border border-black bg-white px-3 py-2 text-sm text-black dark:border-white dark:bg-black dark:text-white">
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
            {confirmStep ? (
              <button
                onClick={() => setConfirmStep(false)}
                className="inline-flex h-10 items-center rounded-sm border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-800 dark:bg-black dark:text-white dark:hover:bg-neutral-900"
                disabled={isSubmitting}
              >
                Chỉnh sửa
              </button>
            ) : null}

            <button
              onClick={onClose}
              className="inline-flex h-10 items-center rounded-sm border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-800 dark:bg-black dark:text-white dark:hover:bg-neutral-900"
              disabled={isSubmitting}
            >
              Đóng
            </button>

            <button
              onClick={confirmStep ? handleSubmit : handleContinue}
              className="inline-flex h-10 items-center rounded-sm bg-black px-5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
              disabled={isSubmitting}
            >
              {confirmStep
                ? isSubmitting
                  ? "Đang gửi..."
                  : "Xác nhận gửi yêu cầu"
                : "Tiếp tục"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
