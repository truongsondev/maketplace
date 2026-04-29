"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReturnReasonCode } from "@/types/order.types";

export interface ReturnRequestFormPayload {
  reasonCode: ReturnReasonCode;
  reason?: string;
  images: File[];
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
}

const REASON_OPTIONS: Array<{ value: ReturnReasonCode; label: string }> = [
  { value: "WRONG_MODEL", label: "Không đúng mẫu" },
  { value: "WRONG_SIZE", label: "Không vừa, muốn đổi size" },
  { value: "DEFECTIVE", label: "Hàng bị lỗi" },
];

function reasonLabel(reasonCode: ReturnReasonCode): string {
  return REASON_OPTIONS.find((item) => item.value === reasonCode)?.label ?? reasonCode;
}

export function ReturnRequestModal({
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
  onConfirm: (payload: ReturnRequestFormPayload) => Promise<void>;
}) {
  const [reasonCode, setReasonCode] = useState<ReturnReasonCode>("WRONG_MODEL");
  const [reason, setReason] = useState("");
  const [images, setImages] = useState<Array<{ file: File; previewUrl: string }>>([]);
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmStep, setConfirmStep] = useState(false);

  useEffect(() => {
    if (open) return;
    const handle = window.setTimeout(() => {
      setReasonCode("WRONG_MODEL");
      setReason("");
      setBankAccountName("");
      setBankAccountNumber("");
      setBankName("");
      setError(null);
      setConfirmStep(false);
      setImages((prev) => {
        prev.forEach((image) => URL.revokeObjectURL(image.previewUrl));
        return [];
      });
    }, 0);
    return () => window.clearTimeout(handle);
  }, [open]);

  const payload = useMemo(
    () => ({
      reasonCode,
      reason: reason.trim() || undefined,
      images: images.map((image) => image.file),
      bankAccountName: bankAccountName.trim(),
      bankAccountNumber: bankAccountNumber.trim(),
      bankName: bankName.trim(),
    }),
    [reasonCode, reason, images, bankAccountName, bankAccountNumber, bankName],
  );

  if (!open) return null;

  const validate = (): boolean => {
    if (payload.images.length === 0) {
      setError("Vui lòng tải lên ít nhất 1 ảnh minh chứng.");
      return false;
    }

    if (!payload.bankAccountName || !payload.bankAccountNumber || !payload.bankName) {
      setError("Vui lòng nhập đầy đủ thông tin chuyển khoản nhận hoàn tiền.");
      return false;
    }

    setError(null);
    return true;
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
        <div className="border-b border-neutral-200 px-6 py-5 dark:border-neutral-800">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Trả hàng/Hoàn tiền
          </p>
          <h3 className="mt-2 text-xl font-semibold text-neutral-900 dark:text-white">
            Gửi yêu cầu trả hàng
          </h3>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
            Đơn: {orderLabel}
          </p>
        </div>

        <div className="px-6 py-5">
          <div className="mb-5 flex items-center gap-2 text-xs font-semibold">
            <span className={`inline-flex rounded-full px-3 py-1 ${!confirmStep ? "bg-black text-white dark:bg-white dark:text-black" : "bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300"}`}>
              1. Nhập thông tin
            </span>
            <span className="text-neutral-400">/</span>
            <span className={`inline-flex rounded-full px-3 py-1 ${confirmStep ? "bg-black text-white dark:bg-white dark:text-black" : "bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300"}`}>
              2. Xác nhận
            </span>
          </div>

          {!confirmStep ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  Lý do trả hàng
                </label>
                <select
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value as ReturnReasonCode)}
                  className="h-11 w-full rounded-sm border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-black/10 dark:border-neutral-800 dark:bg-black dark:text-white"
                >
                  {REASON_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  Mô tả thêm (tuỳ chọn)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-sm border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-black/10 dark:border-neutral-800 dark:bg-black dark:text-white"
                  placeholder="Ví dụ: áo nhận được khác màu trên hình..."
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  Ảnh minh chứng
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex h-10 cursor-pointer items-center rounded-sm border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-900 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-black dark:text-white">
                    Chọn ảnh
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      disabled={isSubmitting || images.length >= 6}
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? []);
                        e.target.value = "";
                        setImages((prev) => [
                          ...prev,
                          ...files.slice(0, Math.max(0, 6 - prev.length)).map((file) => ({
                            file,
                            previewUrl: URL.createObjectURL(file),
                          })),
                        ]);
                      }}
                    />
                  </label>
                  {images.map((image, index) => (
                    <div key={image.previewUrl} className="relative h-14 w-14 overflow-hidden rounded-sm border border-neutral-200">
                      <img src={image.previewUrl} alt={`Ảnh minh chứng ${index + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        aria-label="Xóa ảnh"
                        className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs font-bold text-white"
                        onClick={() => {
                          setImages((prev) => {
                            const next = prev.slice();
                            const removed = next.splice(index, 1)[0];
                            if (removed) URL.revokeObjectURL(removed.previewUrl);
                            return next;
                          });
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-sm border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Thông tin nhận hoàn tiền
                </p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} className="h-11 rounded-sm border border-neutral-300 px-3 text-sm dark:border-neutral-800 dark:bg-black dark:text-white" placeholder="Tên chủ tài khoản" />
                  <input value={bankName} onChange={(e) => setBankName(e.target.value)} className="h-11 rounded-sm border border-neutral-300 px-3 text-sm dark:border-neutral-800 dark:bg-black dark:text-white" placeholder="Ngân hàng" />
                  <input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} className="h-11 rounded-sm border border-neutral-300 px-3 text-sm sm:col-span-2 dark:border-neutral-800 dark:bg-black dark:text-white" placeholder="Số tài khoản" />
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-sm border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100">
              <p className="font-semibold">Xác nhận thông tin trả hàng:</p>
              <div className="mt-3 space-y-2 rounded-sm border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-black">
                <p>Lý do: {reasonLabel(payload.reasonCode)}</p>
                {payload.reason ? <p>Mô tả: {payload.reason}</p> : null}
                <p>Ảnh minh chứng: {payload.images.length} ảnh</p>
                <p>Tài khoản: {payload.bankAccountName} - {payload.bankAccountNumber} - {payload.bankName}</p>
              </div>
            </div>
          )}

          {error ? (
            <p className="mt-3 rounded-sm border border-black px-3 py-2 text-sm text-black dark:border-white dark:text-white">
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
            {confirmStep ? (
              <button type="button" onClick={() => setConfirmStep(false)} disabled={isSubmitting} className="inline-flex h-10 items-center rounded-sm border border-neutral-300 px-4 text-sm font-semibold">
                Chỉnh sửa
              </button>
            ) : null}
            <button type="button" onClick={onClose} disabled={isSubmitting} className="inline-flex h-10 items-center rounded-sm border border-neutral-300 px-4 text-sm font-semibold">
              Đóng
            </button>
            <button
              type="button"
              onClick={confirmStep ? handleSubmit : () => validate() && setConfirmStep(true)}
              disabled={isSubmitting}
              className="inline-flex h-10 items-center rounded-sm bg-black px-5 text-sm font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-black"
            >
              {confirmStep ? (isSubmitting ? "Đang gửi..." : "Xác nhận gửi yêu cầu") : "Tiếp tục"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
