"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  useCancelMyOrder,
  useConfirmReceivedOrder,
  useMyOrderDetail,
  useRequestPaidCancelOrder,
  useRequestReturnOrder,
} from "@/hooks/use-orders";
import { PaidCancelRequestModal } from "@/components/page/paid-cancel-request-modal";
import {
  useCreateReview,
  useOrderReviewStatus,
  useReviewUploadSignature,
  useUploadReviewImage,
} from "@/hooks/use-reviews";

function formatMoney(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("vi-VN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusText(status: string) {
  switch (status) {
    case "PENDING":
      return "Chờ xác nhận";
    case "CONFIRMED":
    case "PAID":
      return "Đang xử lý";
    case "SHIPPED":
      return "Đang giao";
    case "DELIVERED":
      return "Hoàn thành";
    case "RETURNED":
      return "Đang trả hàng";
    case "CANCELLED":
      return "Đã hủy";
    default:
      return status;
  }
}

function refundStatusText(status: string) {
  switch (status) {
    case "PENDING":
      return "Chờ xử lý";
    case "SUCCESS":
      return "Thành công";
    case "FAILED":
      return "Thất bại";
    case "RETRYING":
      return "Đang thử lại";
    default:
      return status;
  }
}

function cancelRequestStatusText(status: string) {
  switch (status) {
    case "REQUESTED":
      return "Chờ admin duyệt";
    case "APPROVED":
      return "Đã duyệt, chờ hoàn tiền thủ công";
    case "REJECTED":
      return "Bị từ chối";
    case "COMPLETED":
      return "Đã hoàn tất";
    default:
      return status;
  }
}

export function OrderDetailClient({
  orderId,
  mode = "page",
  onClose,
}: {
  orderId: string;
  mode?: "page" | "modal";
  onClose?: () => void;
}) {
  const [openPaidCancelModal, setOpenPaidCancelModal] = useState(false);
  const [reviewingItemId, setReviewingItemId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImages, setReviewImages] = useState<
    Array<{ file: File; previewUrl: string }>
  >([]);
  const reviewImagesRef = useRef(reviewImages);

  const detailQuery = useMyOrderDetail(orderId);
  const cancelMutation = useCancelMyOrder();
  const requestPaidCancelMutation = useRequestPaidCancelOrder();
  const confirmReceivedMutation = useConfirmReceivedOrder();
  const requestReturnMutation = useRequestReturnOrder();

  const signatureMutation = useReviewUploadSignature();
  const uploadImageMutation = useUploadReviewImage();
  const createReviewMutation = useCreateReview();

  const order = detailQuery.data;

  const canReview = order?.status === "DELIVERED";
  const reviewStatusQuery = useOrderReviewStatus(orderId, Boolean(canReview));

  const reviewedOrderItemIdSet = useMemo(() => {
    const set = new Set<string>();
    const items = reviewStatusQuery.data?.items ?? [];
    for (const it of items) {
      if (it.reviewed) set.add(it.orderItemId);
    }
    return set;
  }, [reviewStatusQuery.data]);

  useEffect(() => {
    reviewImagesRef.current = reviewImages;
  }, [reviewImages]);

  useEffect(() => {
    return () => {
      for (const img of reviewImagesRef.current) {
        URL.revokeObjectURL(img.previewUrl);
      }
    };
  }, []);

  const isPaidFlow =
    (order?.status === "PAID" || order?.status === "CONFIRMED") &&
    (order?.payment.status === "PAID" || order?.payment.status === "SUCCESS");

  const canCancel =
    (order?.status === "PENDING" || order?.status === "CONFIRMED") &&
    !isPaidFlow;

  const canRequestPaidCancel =
    Boolean(isPaidFlow) &&
    order?.cancelRequest?.status !== "REQUESTED" &&
    order?.cancelRequest?.status !== "APPROVED";

  const canConfirmReceived = order?.status === "SHIPPED";
  const canRequestReturn = order?.status === "DELIVERED";

  const isSubmittingReview =
    signatureMutation.isPending ||
    uploadImageMutation.isPending ||
    createReviewMutation.isPending;

  const resetReviewForm = () => {
    setReviewRating(5);
    setReviewComment("");
    setReviewingItemId(null);
    setReviewImages((prev) => {
      for (const img of prev) {
        URL.revokeObjectURL(img.previewUrl);
      }
      return [];
    });
  };

  const submitReview = async () => {
    if (!order || !reviewingItemId) return;

    const safeComment = reviewComment.trim() ? reviewComment.trim() : null;
    if (
      !Number.isInteger(reviewRating) ||
      reviewRating < 1 ||
      reviewRating > 5
    ) {
      toast.error("Vui lòng chọn số sao hợp lệ");
      return;
    }

    try {
      const signature = await signatureMutation.mutateAsync({
        orderId: order.id,
      });

      const uploads = await Promise.all(
        reviewImages.map((img) =>
          uploadImageMutation.mutateAsync({ file: img.file, signature }),
        ),
      );

      await createReviewMutation.mutateAsync({
        orderItemId: reviewingItemId,
        rating: reviewRating,
        comment: safeComment,
        images: uploads.map((u) => ({ url: u.url, publicId: u.publicId })),
      });

      await reviewStatusQuery.refetch();
      resetReviewForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Đã có lỗi xảy ra";
      toast.error("Không thể gửi đánh giá", { description: message });
    }
  };

  const containerClassName =
    mode === "modal"
      ? "w-full px-4 py-6 sm:px-6"
      : "mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8";

  const shellClassName =
    mode === "modal"
      ? ""
      : "rounded-sm border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-black";

  const deliveryLines = useMemo(() => {
    const raw: any = order as any;
    if (!raw) return [] as string[];

    const candidates = [
      raw.shippingAddress,
      raw.deliveryAddress,
      raw.address,
      raw.customerAddress,
      raw.shipping?.address,
    ].filter(Boolean);

    const addr = candidates[0];
    if (!addr) return [] as string[];

    const lines: string[] = [];
    const name = addr.fullName ?? addr.name;
    const phone = addr.phoneNumber ?? addr.phone;
    const line1 = addr.addressLine1 ?? addr.street ?? addr.line1;
    const line2 = addr.addressLine2 ?? addr.ward ?? addr.line2;
    const city = addr.city ?? addr.district;
    const country = addr.country;

    if (line1) lines.push(String(line1));
    if (line2) lines.push(String(line2));
    const cityLine = [city, country].filter(Boolean).join(", ");
    if (cityLine) lines.push(cityLine);
    if (phone) lines.push(String(phone));
    if (name && lines.length === 0) lines.push(String(name));

    return lines;
  }, [order]);

  return (
    <main className={containerClassName}>
      <div className={shellClassName}>
        <div className="flex flex-col gap-4 border-b border-neutral-200 px-4 py-4 dark:border-neutral-800 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div className="min-w-0">
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              Order ID: {order ? `#${order.orderCode ?? order.id}` : "—"}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500 dark:text-neutral-400">
              <span>
                Order date: {order ? formatDate(order.createdAt) : "—"}
              </span>
              <span className="hidden h-4 w-px bg-neutral-200 dark:bg-neutral-800 sm:inline-block" />
              <span className="font-semibold text-neutral-900 dark:text-white">
                {order ? statusText(order.status) : ""}
              </span>
            </div>

            {order?.status === "CANCELLED" && order.canceledReason ? (
              <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">
                Lý do hủy: {order.canceledReason}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {mode === "page" ? (
              <Link
                href="/orders"
                className="inline-flex h-10 items-center rounded-sm border border-neutral-200 bg-white px-5 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-black dark:text-white dark:hover:bg-neutral-900"
              >
                Quay lại
              </Link>
            ) : null}

            {order && canConfirmReceived ? (
              <button
                type="button"
                onClick={() => confirmReceivedMutation.mutate(order.id)}
                disabled={
                  confirmReceivedMutation.isPending || detailQuery.isLoading
                }
                className="inline-flex h-10 items-center rounded-sm bg-black px-5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
              >
                Xác nhận đã nhận hàng
              </button>
            ) : null}

            {order && canRequestReturn ? (
              <button
                type="button"
                onClick={() => {
                  const raw =
                    window.prompt("Lý do trả hàng/hoàn tiền (tuỳ chọn)") ?? "";
                  const reason = raw.trim() ? raw.trim() : undefined;
                  requestReturnMutation.mutate({ orderId: order.id, reason });
                }}
                disabled={
                  requestReturnMutation.isPending || detailQuery.isLoading
                }
                className="inline-flex h-10 items-center rounded-sm border border-neutral-900 bg-white px-5 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-100 dark:bg-black dark:text-neutral-100 dark:hover:bg-white dark:hover:text-black"
              >
                Trả hàng/Hoàn tiền
              </button>
            ) : null}

            {order && canCancel ? (
              <button
                type="button"
                onClick={() => cancelMutation.mutate(order.id)}
                disabled={cancelMutation.isPending}
                className="inline-flex h-10 items-center rounded-sm border border-black bg-white px-5 text-sm font-semibold text-black transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-white dark:bg-black dark:text-white dark:hover:bg-white dark:hover:text-black"
              >
                Hủy đơn
              </button>
            ) : null}

            {order && canRequestPaidCancel ? (
              <button
                type="button"
                onClick={() => setOpenPaidCancelModal(true)}
                disabled={requestPaidCancelMutation.isPending}
                className="inline-flex h-10 items-center rounded-sm border border-neutral-900 bg-white px-5 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-100 dark:bg-black dark:text-neutral-100 dark:hover:bg-white dark:hover:text-black"
              >
                Yêu cầu hủy
              </button>
            ) : null}
          </div>
        </div>

        <div className="px-4 pb-6 pt-4 sm:px-6">
          {detailQuery.isLoading ? (
            <div className="rounded-sm border border-neutral-200 bg-white p-6 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-black dark:text-neutral-300">
              Đang tải đơn hàng...
            </div>
          ) : detailQuery.isError || !order ? (
            <div className="rounded-sm border border-neutral-200 bg-white p-6 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-black dark:text-neutral-200">
              Không thể tải chi tiết đơn hàng.
            </div>
          ) : (
            <>
              <section className="rounded-sm border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-black">
                <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-neutral-50 ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800">
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="text-xs text-neutral-500 dark:text-neutral-400">
                            Không có ảnh
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                          {item.name}
                        </p>
                        {item.attributesText ? (
                          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                            {item.attributesText}
                          </p>
                        ) : null}

                        {canReview ? (
                          <div className="mt-2">
                            {reviewedOrderItemIdSet.has(item.id) ? (
                              <p className="text-xs font-semibold text-text-muted">
                                Đã đánh giá
                              </p>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setReviewingItemId(item.id);
                                  setReviewRating(5);
                                  setReviewComment("");
                                  setReviewImages((prev) => {
                                    for (const img of prev) {
                                      URL.revokeObjectURL(img.previewUrl);
                                    }
                                    return [];
                                  });
                                }}
                                disabled={isSubmittingReview}
                                className="inline-flex h-9 items-center rounded-sm border border-neutral-200 bg-white px-4 text-xs font-semibold text-neutral-900 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-800 dark:bg-black dark:text-white dark:hover:bg-neutral-900"
                              >
                                Đánh giá
                              </button>
                            )}
                          </div>
                        ) : null}
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                          {formatMoney(item.price)}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                          Qty: {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                    Payment
                  </h3>
                  <div className="mt-3 space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
                    <p className="text-neutral-900 dark:text-white">
                      {order.payment.method ?? "—"}
                    </p>
                    <p>
                      Trạng thái:{" "}
                      {order.payment.status ??
                        order.payment.transactionStatus ??
                        "—"}
                    </p>
                    {order.refund ? (
                      <p>
                        Hoàn tiền: {refundStatusText(order.refund.status)} (
                        {formatMoney(order.refund.amount)})
                      </p>
                    ) : null}
                    {order.cancelRequest ? (
                      <p>
                        Yêu cầu hủy:{" "}
                        {cancelRequestStatusText(order.cancelRequest.status)}
                      </p>
                    ) : null}
                  </div>
                </div>

                {deliveryLines.length > 0 ? (
                  <div>
                    <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                      Delivery
                    </h3>
                    <div className="mt-3 space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
                      {deliveryLines.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>

              {canReview && reviewingItemId ? (
                <section className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-700 dark:bg-neutral-950">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      Đánh giá sản phẩm
                    </h3>
                    <button
                      type="button"
                      onClick={resetReviewForm}
                      disabled={isSubmittingReview}
                      className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 disabled:opacity-60 dark:text-neutral-300 dark:hover:text-white"
                    >
                      Đóng
                    </button>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">
                      Số sao
                    </p>
                    <div className="mt-2 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className={
                            "text-2xl leading-none " +
                            (star <= reviewRating
                              ? "text-neutral-900 dark:text-white"
                              : "text-neutral-300 dark:text-neutral-700")
                          }
                          aria-label={`Chọn ${star} sao`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">
                      Nội dung (tuỳ chọn)
                    </label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={4}
                      className="mt-2 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                      placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                    />
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">
                      Ảnh (tối đa 6)
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <label className="inline-flex h-9 cursor-pointer items-center rounded-xl border border-neutral-300 bg-white px-4 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100">
                        Chọn ảnh
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const files = Array.from(e.target.files ?? []);
                            e.target.value = "";
                            if (files.length === 0) return;

                            setReviewImages((prev) => {
                              const remaining = Math.max(0, 6 - prev.length);
                              const next = files
                                .slice(0, remaining)
                                .map((file) => ({
                                  file,
                                  previewUrl: URL.createObjectURL(file),
                                }));
                              return [...prev, ...next];
                            });
                          }}
                          disabled={
                            reviewImages.length >= 6 || isSubmittingReview
                          }
                        />
                      </label>

                      {reviewImages.length > 0 ? (
                        <div className="flex flex-wrap gap-3">
                          {reviewImages.map((img, idx) => (
                            <div
                              key={img.previewUrl}
                              className="relative h-14 w-14 overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={img.previewUrl}
                                alt={`Review image ${idx + 1}`}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setReviewImages((prev) => {
                                    const next = prev.slice();
                                    const removed = next.splice(idx, 1)[0];
                                    if (removed) {
                                      URL.revokeObjectURL(removed.previewUrl);
                                    }
                                    return next;
                                  });
                                }}
                                disabled={isSubmittingReview}
                                className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs font-bold text-white disabled:opacity-60"
                                aria-label="Xóa ảnh"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={resetReviewForm}
                      disabled={isSubmittingReview}
                      className="inline-flex h-10 items-center rounded-xl border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={submitReview}
                      disabled={isSubmittingReview}
                      className="inline-flex h-10 items-center rounded-xl bg-black px-5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Gửi đánh giá
                    </button>
                  </div>
                </section>
              ) : null}

              <div className="mt-6 flex items-center justify-between border-t border-border-color pt-4 text-sm">
                <span className="text-text-muted">Tổng cộng</span>
                <span className="text-base font-bold text-text-main">
                  {formatMoney(order.totalPrice)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <PaidCancelRequestModal
        open={Boolean(order && openPaidCancelModal)}
        orderLabel={order ? (order.orderCode ?? order.id) : ""}
        isSubmitting={requestPaidCancelMutation.isPending}
        onClose={() => {
          if (requestPaidCancelMutation.isPending) {
            return;
          }
          setOpenPaidCancelModal(false);
        }}
        onConfirm={async (payload) => {
          if (!order) {
            return;
          }

          await new Promise<void>((resolve, reject) => {
            requestPaidCancelMutation.mutate(
              { orderId: order.id, ...payload },
              {
                onSuccess: () => {
                  setOpenPaidCancelModal(false);
                  resolve();
                },
                onError: (error) => {
                  reject(error);
                },
              },
            );
          });
        }}
      />
    </main>
  );
}
