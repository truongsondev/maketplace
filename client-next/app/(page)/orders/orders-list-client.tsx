"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  PackageCheck,
  X,
} from "lucide-react";
import {
  useCancelMyOrder,
  useMyOrderCounts,
  useMyOrders,
  useRequestPaidCancelOrder,
} from "@/hooks/use-orders";
import { useOrderReviewStatus } from "@/hooks/use-reviews";
import { PaidCancelRequestModal } from "@/components/page/paid-cancel-request-modal";
import { OrderDetailClient } from "@/app/(page)/orders/order-detail-client";
import { RecommendationShelf } from "@/components/page/recommendation-shelf";
import { Header } from "@/components/page/header";
import { Footer } from "@/components/page/footer";
import { cartService } from "@/services/cart.service";
import { useAuthStore } from "@/stores/auth.store";
import type { MyOrderListItem, OrderTab } from "@/types/order.types";

const ORDERS_PAGE_LIMIT = 6;

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

function statusLabel(status: string) {
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

function statusBadge(status: string) {
  void status;
  return "border-black/10 bg-white/45 text-neutral-700 dark:border-white/10 dark:bg-white/5 dark:text-neutral-200";
}

function refundStatusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "Hoàn tiền: Chờ xử lý";
    case "SUCCESS":
      return "Hoàn tiền: Thành công";
    case "FAILED":
      return "Hoàn tiền: Thất bại";
    case "RETRYING":
      return "Hoàn tiền: Đang thử lại";
    default:
      return `Hoàn tiền: ${status}`;
  }
}

function refundBadge(status: string) {
  void status;
  return "border-black/10 bg-white/45 text-neutral-700 dark:border-white/10 dark:bg-white/5 dark:text-neutral-200";
}

function cancelRequestStatusText(status: string) {
  switch (status) {
    case "REQUESTED":
      return "Yêu cầu hủy: Chờ admin duyệt";
    case "APPROVED":
      return "Yêu cầu hủy: Đã duyệt, chờ hoàn tiền";
    case "REJECTED":
      return "Yêu cầu hủy: Bị từ chối";
    case "COMPLETED":
      return "Yêu cầu hủy: Đã hoàn tất";
    default:
      return `Yêu cầu hủy: ${status}`;
  }
}

function cancelRequestBadge(status: string) {
  void status;
  return "border-black/10 bg-white/45 text-neutral-700 dark:border-white/10 dark:bg-white/5 dark:text-neutral-200";
}

function isPaymentSuccessful(order: MyOrderListItem): boolean {
  return (
    order.payment.status === "PAID" ||
    order.payment.status === "SUCCESS" ||
    order.payment.transactionStatus === "PAID" ||
    Boolean(order.payment.paidAt) ||
    Boolean(order.payment.transactionPaidAt)
  );
}

function paymentSummaryLabel(order: MyOrderListItem): string {
  if (order.refund?.status === "SUCCESS") {
    return "Đã hoàn tiền";
  }

  if (isPaymentSuccessful(order)) {
    return "Đã thanh toán";
  }

  if (
    order.payment.status === "EXPIRED" ||
    order.payment.transactionStatus === "EXPIRED"
  ) {
    return "Link thanh toán hết hạn";
  }

  if (
    order.payment.status === "FAILED" ||
    order.payment.transactionStatus === "FAILED"
  ) {
    return "Thanh toán thất bại";
  }

  if (
    order.payment.status === "PENDING" ||
    order.payment.transactionStatus === "PENDING"
  ) {
    return "Đang chờ thanh toán";
  }

  return "Chưa thanh toán";
}

function OrderCard({
  order,
  onOpenDetail,
  onCancel,
  onRequestPaidCancel,
  canceling,
  requestingPaidCancel,
}: {
  order: MyOrderListItem;
  onOpenDetail: () => void;
  onCancel: (order: MyOrderListItem) => void;
  onRequestPaidCancel: (order: MyOrderListItem) => void;
  canceling: boolean;
  requestingPaidCancel: boolean;
}) {
  const first = order.items[0];
  const extraCount = Math.max(order.items.length - 1, 0);
  const isPaidFlow =
    (order.status === "PAID" || order.status === "CONFIRMED") &&
    isPaymentSuccessful(order);
  const canCancel =
    ["PENDING", "CONFIRMED"].includes(order.status) && !isPaidFlow;
  const canRequestPaidCancel =
    isPaidFlow &&
    order.cancelRequest?.status !== "REQUESTED" &&
    order.cancelRequest?.status !== "APPROVED";

  const canReview = order.status === "DELIVERED";
  const reviewStatusQuery = useOrderReviewStatus(order.id, Boolean(canReview));
  const hasUnreviewedItems = useMemo(() => {
    if (!canReview) return false;
    const items = reviewStatusQuery.data?.items;
    if (!items) return true;
    return items.some((it) => !it.reviewed);
  }, [canReview, reviewStatusQuery.data?.items]);

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={onOpenDetail}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenDetail();
        }
      }}
      className="group cursor-pointer border-y border-black/10 bg-transparent transition-colors hover:bg-white/45 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:border-white/10 dark:hover:bg-white/5 dark:focus:ring-white/15"
      aria-label={`Mở chi tiết đơn hàng ${order.orderCode ?? order.id}`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-black/10 px-4 py-4 dark:border-white/10">
        <div className="min-w-0">
          <p className="luxury-eyebrow">Private order</p>
          <p className="mt-2 truncate text-base font-semibold uppercase tracking-[0.08em] text-neutral-900 dark:text-white">
            #{order.orderCode ?? order.id}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 text-right">
          <span className="inline-flex items-center border border-black/10 bg-white/45 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-600 dark:border-white/10 dark:bg-white/5 dark:text-neutral-300">
            {formatDate(order.createdAt)}
          </span>
          <span
            className={`inline-flex items-center border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${statusBadge(
              order.status,
            )}`}
          >
            {statusLabel(order.status)}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="bg-white/35 p-3 dark:bg-white/5">
          <div className="flex items-start gap-4">
            <div className="flex h-24 w-18 shrink-0 items-center justify-center overflow-hidden bg-white ring-1 ring-black/10 dark:bg-neutral-900 dark:ring-white/10">
              {first?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={first.imageUrl}
                  alt={first.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="text-xs text-neutral-500">Không có ảnh</div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-semibold uppercase leading-6 tracking-[0.04em] text-neutral-900 dark:text-white">
                {first?.name ?? "(Không có sản phẩm)"}
              </p>
              {first?.attributesText ? (
                <p className="mt-1 line-clamp-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {first.attributesText}
                </p>
              ) : null}
              {first ? (
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  SL: {first.quantity}
                  {extraCount > 0 ? ` • +${extraCount} sản phẩm khác` : ""}
                </p>
              ) : null}

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center border border-black/10 bg-white/45 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-600 dark:border-white/10 dark:bg-white/5 dark:text-neutral-300">
                  {order.payment.method ?? "COD"}
                </span>
                <span className="inline-flex items-center border border-black/10 bg-white/45 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-600 dark:border-white/10 dark:bg-white/5 dark:text-neutral-300">
                  {paymentSummaryLabel(order)}
                </span>

                {order.refund ? (
                  <span
                    className={`inline-flex items-center border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${refundBadge(
                      order.refund.status,
                    )}`}
                  >
                    {refundStatusLabel(order.refund.status)}
                  </span>
                ) : null}

                {order.cancelRequest ? (
                  <span
                    className={`inline-flex items-center border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${cancelRequestBadge(
                      order.cancelRequest.status,
                    )}`}
                  >
                    {cancelRequestStatusText(order.cancelRequest.status)}
                  </span>
                ) : null}

                {order.status === "CANCELLED" && order.canceledReason ? (
                  <p className="w-full text-xs font-medium text-red-600 dark:text-red-400">
                    Lý do hủy: {order.canceledReason}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-black/10 px-4 py-3 dark:border-white/10">
        <div className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-600 dark:text-neutral-400">
          {order.items.length} sản phẩm • {formatMoney(order.totalPrice)}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {canReview ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail();
              }}
              disabled={!hasUnreviewedItems}
              className="luxury-button-ghost h-9 px-3 py-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {hasUnreviewedItems ? "Viết đánh giá" : "Đã đánh giá"}
            </button>
          ) : null}

          {canCancel ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCancel(order);
              }}
              disabled={canceling}
              className="luxury-button-ghost h-9 px-3 py-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Hủy đơn
            </button>
          ) : null}

          {canRequestPaidCancel ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRequestPaidCancel(order);
              }}
              disabled={requestingPaidCancel}
              className="luxury-button-ghost h-9 px-3 py-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Yêu cầu hủy
            </button>
          ) : null}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail();
            }}
            className="luxury-button h-9 px-4 py-0"
          >
            Chi tiết
          </button>
        </div>
      </div>
    </article>
  );
}

export function OrdersListClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isDark, setIsDark] = useState(false);
  const [tab, setTab] = useState<OrderTab>("all");
  const [page, setPage] = useState(1);
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null);
  const [requestingPaidCancelOrderId, setRequestingPaidCancelOrderId] =
    useState<string | null>(null);
  const [paidCancelTargetOrder, setPaidCancelTargetOrder] =
    useState<MyOrderListItem | null>(null);
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data: cartSummary } = useQuery({
    queryKey: ["cart", "summary"],
    queryFn: () => cartService.getCartSummary(),
    enabled: isAuthenticated,
    retry: false,
    staleTime: 1000 * 30,
  });

  const cartCount = cartSummary?.totalItems ?? 0;

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const countsQuery = useMyOrderCounts();
  const ordersQuery = useMyOrders({
    tab,
    sort: "new",
    page,
    limit: ORDERS_PAGE_LIMIT,
  });
  const cancelMutation = useCancelMyOrder();
  const requestPaidCancelMutation = useRequestPaidCancelOrder();

  const tabs = useMemo(() => {
    const c = countsQuery.data;
    return [
      { key: "all" as const, label: "Tất cả", count: c?.all ?? 0 },
      {
        key: "pending" as const,
        label: "Chờ xác nhận",
        count: c?.pending ?? 0,
      },
      {
        key: "processing" as const,
        label: "Đang xử lý",
        count: c?.processing ?? 0,
      },
      { key: "shipped" as const, label: "Đang giao", count: c?.shipped ?? 0 },
      {
        key: "completed" as const,
        label: "Hoàn thành",
        count: c?.completed ?? 0,
      },
      { key: "canceled" as const, label: "Đã hủy", count: c?.canceled ?? 0 },
    ];
  }, [countsQuery.data]);

  const totalPages = Math.max(ordersQuery.data?.pagination.totalPages ?? 1, 1);
  const displayPage = Math.min(page, totalPages);

  const handleCancelOrder = (order: MyOrderListItem) => {
    setCancelingOrderId(order.id);
    cancelMutation.mutate(order.id, {
      onSettled: () => setCancelingOrderId(null),
    });
  };

  const handleRequestPaidCancel = (order: MyOrderListItem) => {
    setPaidCancelTargetOrder(order);
  };

  const orderIdFromUrl = searchParams.get("orderId");

  const openDetailModal = (orderId: string) => {
    setOpenOrderId(orderId);
    const next = new URLSearchParams(searchParams.toString());
    next.set("orderId", orderId);
    router.replace(`/orders?${next.toString()}`, { scroll: false });
  };

  const closeDetailModal = useCallback(() => {
    setOpenOrderId(null);
    const next = new URLSearchParams(searchParams.toString());
    next.delete("orderId");
    const qs = next.toString();
    router.replace(qs ? `/orders?${qs}` : "/orders", { scroll: false });
  }, [router, searchParams]);

  const effectiveOpenOrderId = orderIdFromUrl || openOrderId;

  useEffect(() => {
    if (!effectiveOpenOrderId) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeDetailModal();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeDetailModal, effectiveOpenOrderId]);

  return (
    <div className="luxury-page flex min-h-screen flex-col overflow-x-hidden transition-colors duration-200">
      <Header
        isDark={isDark}
        onToggleDarkMode={() => setIsDark((prev) => !prev)}
        cartCount={cartCount}
      />

      <main className="luxury-container flex-1 pb-20 pt-34">
        <div className="mx-auto w-full max-w-6xl">
          <header className="mb-10">
            <p className="luxury-eyebrow">Private order archive</p>
            <h1 className="luxury-title mt-4">Lịch sử đơn hàng</h1>
            <p className="luxury-copy mt-4 max-w-2xl">
              Theo dõi từng lần mua như một nhật ký tủ đồ: trạng thái xử lý,
              thanh toán, hoàn tiền và những item đã chọn.
            </p>
          </header>

          <section className="border-y border-black/10 py-4 dark:border-white/10">
            <nav
              className="-mx-4 overflow-x-auto px-4"
              aria-label="Trạng thái đơn hàng"
            >
              <div className="min-w-max">
                <div className="flex items-center gap-2">
                  {tabs.map((t) => {
                    const active = tab === t.key;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => {
                          setTab(t.key);
                          setPage(1);
                        }}
                        className={`whitespace-nowrap border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition-colors ${
                          active
                            ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                            : "border-black/10 text-neutral-500 hover:border-black/30 hover:text-black dark:border-white/10 dark:text-neutral-400 dark:hover:border-white/30 dark:hover:text-white"
                        }`}
                        aria-current={active ? "page" : undefined}
                      >
                        {t.label}{" "}
                        <span className="opacity-55">({t.count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </nav>
          </section>

          <div className="mt-6">
            {ordersQuery.isLoading ? (
              <div className="flex items-center gap-2 border-y border-black/10 p-6 text-sm text-neutral-600 dark:border-white/10 dark:text-neutral-300">
                <Clock3 className="h-4 w-4" />
                Đang tải đơn hàng...
              </div>
            ) : ordersQuery.isError ? (
              <div className="border-y border-black/10 p-6 text-sm text-neutral-700 dark:border-white/10 dark:text-neutral-200">
                Không thể tải danh sách đơn hàng.
              </div>
            ) : (ordersQuery.data?.items?.length ?? 0) === 0 ? (
              <div className="grid overflow-hidden bg-neutral-950 text-white md:grid-cols-[0.9fr_1.1fr]">
                <div className="flex flex-col justify-center px-6 py-12 md:px-10">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/55">
                    Order archive
                  </p>
                  <h2 className="mt-5 text-5xl font-semibold uppercase leading-[0.92] tracking-[-0.05em] md:text-7xl">
                    Chưa có lịch sử mua sắm
                  </h2>
                  <p className="mt-5 max-w-md text-sm leading-7 text-white/68">
                    Khi đơn hàng đầu tiên hoàn tất, AURA sẽ giữ lại mọi dấu mốc
                    để bạn theo dõi tủ đồ của mình rõ hơn.
                  </p>
                  <Link href="/" className="luxury-button mt-8 w-fit">
                    Khám phá bản tuyển chọn
                  </Link>
                </div>
                <div className="relative flex min-h-[320px] items-center justify-center bg-[#f7f3ec]">
                  <PackageCheck className="size-20 text-white/70" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {(ordersQuery.data?.items ?? []).map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onOpenDetail={() => openDetailModal(order.id)}
                    onCancel={handleCancelOrder}
                    onRequestPaidCancel={handleRequestPaidCancel}
                    canceling={
                      cancelMutation.isPending && cancelingOrderId === order.id
                    }
                    requestingPaidCancel={
                      requestPaidCancelMutation.isPending &&
                      requestingPaidCancelOrderId === order.id
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {(ordersQuery.data?.items?.length ?? 0) > 0 && totalPages > 1 ? (
            <section className="mt-6 flex items-center justify-between border-y border-black/10 px-4 py-3 dark:border-white/10 sm:px-5">
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Trang {displayPage} / {totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={displayPage <= 1 || ordersQuery.isFetching}
                  className="luxury-button-ghost h-9 gap-1 px-3 py-0 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Trước
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={displayPage >= totalPages || ordersQuery.isFetching}
                  className="luxury-button-ghost h-9 gap-1 px-3 py-0 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Sau
                  <ChevronRight className="h-4 w-4" />
                </button>

                {ordersQuery.isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin text-neutral-500 dark:text-neutral-400" />
                ) : null}
              </div>
            </section>
          ) : null}

          {isAuthenticated ? (
            <section className="mt-10">
              <RecommendationShelf
                kind="personalized"
                placement="orders_personalized_recommendations"
                title="Gợi ý tiếp theo cho bạn"
                enabled={Boolean(isAuthenticated)}
                emptyMessage="Chưa đủ dữ liệu để tạo gợi ý cá nhân hóa."
              />
            </section>
          ) : null}
        </div>
      </main>

      {effectiveOpenOrderId ? (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label="Chi tiết đơn hàng"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeDetailModal}
          />

          <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-6">
            <div className="relative w-full max-w-5xl overflow-hidden border border-black/10 bg-[#f7f3ec] shadow-[0_30px_90px_rgba(0,0,0,0.28)] dark:border-white/10 dark:bg-neutral-950">
              <button
                type="button"
                onClick={closeDetailModal}
                className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center border border-black/10 bg-white/70 text-neutral-900 transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:focus:ring-white/15"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="max-h-[82vh] overflow-y-auto pt-14 sm:pt-16">
                <OrderDetailClient
                  orderId={effectiveOpenOrderId}
                  mode="modal"
                  onClose={closeDetailModal}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <PaidCancelRequestModal
        open={Boolean(paidCancelTargetOrder)}
        orderLabel={
          paidCancelTargetOrder
            ? (paidCancelTargetOrder.orderCode ?? paidCancelTargetOrder.id)
            : ""
        }
        isSubmitting={requestPaidCancelMutation.isPending}
        onClose={() => {
          if (requestPaidCancelMutation.isPending) {
            return;
          }
          setPaidCancelTargetOrder(null);
        }}
        onConfirm={async (payload) => {
          if (!paidCancelTargetOrder) {
            return;
          }

          setRequestingPaidCancelOrderId(paidCancelTargetOrder.id);

          await new Promise<void>((resolve, reject) => {
            requestPaidCancelMutation.mutate(
              { orderId: paidCancelTargetOrder.id, ...payload },
              {
                onSuccess: () => {
                  setPaidCancelTargetOrder(null);
                  resolve();
                },
                onError: (error) => {
                  reject(error);
                },
                onSettled: () => {
                  setRequestingPaidCancelOrderId(null);
                },
              },
            );
          });
        }}
      />

      <Footer />
    </div>
  );
}
