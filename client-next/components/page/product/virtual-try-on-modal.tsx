"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Download, History, Loader2, Sparkles, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { virtualTryOnService } from "@/services/virtual-try-on.service";
import type { ApiErrorResponse } from "@/types/api.types";
import type { ProductDetail } from "@/types/product";
import type {
  VirtualTryOnCategory,
  VirtualTryOnRequest,
} from "@/types/virtual-try-on.types";

const TERMINAL = new Set(["SUCCEEDED", "FAILED", "TIMEOUT", "CANCELED"]);

function apiErrorMessage(error: unknown, fallback: string): string {
  const apiError = error as ApiErrorResponse;
  return apiError?.error?.message || fallback;
}

function guessCategory(product: ProductDetail): VirtualTryOnCategory {
  const text = [
    product.name,
    ...product.categories.map((category) => category.name),
    ...product.categories.map((category) => category.slug),
    ...product.tags.map((tag) => tag.name),
  ]
    .join(" ")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (/(vay|dam|dress|gown|jumpsuit|romper)/.test(text)) return "dresses";
  if (
    /(quan|short|jean|pants?|trouser|skirt|chan vay|legging|jogger)/.test(text)
  ) {
    return "lower_body";
  }
  return "upper_body";
}

interface VirtualTryOnModalProps {
  product: ProductDetail;
  productImageUrl: string;
  open: boolean;
  onClose: () => void;
}

export function VirtualTryOnModal({
  product,
  productImageUrl,
  open,
  onClose,
}: VirtualTryOnModalProps) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [request, setRequest] = useState<VirtualTryOnRequest | null>(null);

  const category = useMemo(() => guessCategory(product), [product]);
  const previewUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const statusQuery = useQuery({
    queryKey: ["virtual-try-on", request?.id],
    queryFn: () => virtualTryOnService.get(request!.id),
    enabled: Boolean(request?.id && !TERMINAL.has(request.status)),
    refetchInterval: (query) => {
      const data = query.state.data;
      return data && TERMINAL.has(data.status) ? false : 2500;
    },
  });

  const currentRequest = statusQuery.data ?? request;

  const historyQuery = useQuery({
    queryKey: ["virtual-try-on-history"],
    queryFn: () => virtualTryOnService.listHistory({ page: 1, limit: 12 }),
    enabled: open,
  });

  const historyItems = useMemo(
    () =>
      (historyQuery.data?.data ?? []).filter(
        (item) => item.status === "SUCCEEDED" && item.outputImageUrl,
      ),
    [historyQuery.data],
  );

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Vui lòng chọn ảnh cá nhân.");
      if (file.size > 8 * 1024 * 1024) {
        throw new Error("Ảnh cá nhân không được vượt quá 8MB.");
      }
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        throw new Error("Ảnh phải có định dạng JPG, PNG hoặc WEBP.");
      }

      const signature = await virtualTryOnService.getUploadSignature();
      const uploaded = await virtualTryOnService.uploadHumanImage(
        file,
        signature,
      );

      return virtualTryOnService.create({
        productId: product.id,
        productImageUrl,
        humanImageUrl: uploaded.url,
        category,
        crop: false,
        steps: 30,
        seed: 42,
      });
    },
    onSuccess: (data) => {
      setRequest(data);
      queryClient.invalidateQueries({ queryKey: ["virtual-try-on-history"] });
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Không tạo được ảnh thử đồ."));
    },
  });

  const helperText = useMemo(() => {
    if (!currentRequest) {
      return "Chọn ảnh rõ toàn thân hoặc nửa thân để kết quả tốt hơn.";
    }
    if (currentRequest.status === "SUCCEEDED") return "Ảnh thử đồ đã sẵn sàng.";
    if (currentRequest.status === "FAILED") {
      return currentRequest.errorMessage || "AI chưa tạo được ảnh thử đồ.";
    }
    return "AURA đang tạo ảnh thử đồ, bạn chờ một chút nhé.";
  }, [currentRequest]);

  if (!open) return null;

  const isWorking =
    createMutation.isPending ||
    Boolean(currentRequest && !TERMINAL.has(currentRequest.status));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Thử ngay"
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-5xl border border-black/10 bg-[#f7f3ec] shadow-2xl dark:border-white/10 dark:bg-neutral-950">
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute right-3 top-3 z-10 flex size-10 items-center justify-center bg-white/90 text-black shadow-sm dark:bg-neutral-900 dark:text-white"
        >
          <X className="size-5" />
        </button>

        <div className="grid gap-0 md:grid-cols-[0.95fr_1.05fr]">
          <div className="border-b border-black/10 p-5 dark:border-white/10 md:border-b-0 md:border-r">
            <p className="luxury-eyebrow">AI Virtual Try-On</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-black dark:text-white">
              Thử ngay
            </h2>
            <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
              {helperText}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="relative aspect-[3/4] overflow-hidden bg-white dark:bg-neutral-900">
                <Image
                  src={productImageUrl}
                  alt={product.name}
                  fill
                  sizes="240px"
                  className="object-contain"
                />
              </div>
              <label className="relative flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-3 border border-dashed border-black/20 bg-white text-center text-sm text-neutral-600 dark:border-white/20 dark:bg-neutral-900 dark:text-neutral-300">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Ảnh cá nhân"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <>
                    <Upload className="size-7" />
                    Tải ảnh cá nhân
                  </>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            <button
              type="button"
              disabled={!file || isWorking}
              onClick={() => createMutation.mutate()}
              className="luxury-button mt-6 h-12 w-full py-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isWorking ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Đang tạo ảnh...
                </>
              ) : (
                <>
                  <Sparkles className="size-5" />
                  Tạo ảnh thử đồ
                </>
              )}
            </button>
          </div>

          <div className="flex min-h-[520px] flex-col gap-4 p-5">
            <div className="relative flex min-h-[390px] flex-1 items-center justify-center overflow-hidden bg-neutral-100 dark:bg-neutral-900">
              {currentRequest?.status === "SUCCEEDED" &&
              currentRequest.outputImageUrl ? (
                <>
                  <Image
                    src={currentRequest.outputImageUrl}
                    alt="Kết quả thử đồ AI"
                    fill
                    sizes="(max-width: 768px) 100vw, 520px"
                    className="object-contain"
                  />
                  <a
                    href={currentRequest.outputImageUrl}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="absolute bottom-4 right-4 inline-flex h-10 items-center gap-2 bg-black px-4 text-sm font-semibold text-white"
                  >
                    <Download className="size-4" />
                    Lưu ảnh
                  </a>
                </>
              ) : currentRequest?.status === "FAILED" ? (
                <div className="max-w-sm text-center text-sm text-neutral-600 dark:text-neutral-300">
                  {currentRequest.errorMessage || "Không tạo được ảnh thử đồ."}
                </div>
              ) : isWorking ? (
                <div className="flex flex-col items-center gap-3 text-sm text-neutral-600 dark:text-neutral-300">
                  <Loader2 className="size-8 animate-spin" />
                  Đang xử lý ảnh thử đồ...
                </div>
              ) : (
                <div className="max-w-sm text-center text-sm text-neutral-600 dark:text-neutral-300">
                  Kết quả thử đồ sẽ hiển thị tại đây.
                </div>
              )}
            </div>

            <section aria-label="Kết quả thử đồ trước đây">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-black dark:text-white">
                  <History className="size-4" />
                  Kết quả đã thử trước đây
                </div>
                {historyQuery.isFetching ? (
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    Đang tải...
                  </span>
                ) : null}
              </div>

              {historyItems.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {historyItems.map((item) => {
                    const isSelected = currentRequest?.id === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setRequest(item)}
                        className={`relative h-24 w-20 shrink-0 overflow-hidden border bg-white transition dark:bg-neutral-900 ${
                          isSelected
                            ? "border-black ring-2 ring-black/20 dark:border-white dark:ring-white/20"
                            : "border-black/10 hover:border-black/40 dark:border-white/10 dark:hover:border-white/40"
                        }`}
                        aria-label="Xem lại kết quả thử đồ"
                      >
                        <Image
                          src={item.outputImageUrl!}
                          alt="Kết quả thử đồ trước đây"
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-24 items-center justify-center border border-dashed border-black/10 bg-white/60 text-center text-sm text-neutral-500 dark:border-white/10 dark:bg-neutral-900/60 dark:text-neutral-400">
                  Chưa có kết quả thử đồ trước đây.
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
