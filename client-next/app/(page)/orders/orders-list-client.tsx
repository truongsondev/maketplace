"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import { Header } from "@/components/page/header";
import { Footer } from "@/components/page/footer";
import { cartService } from "@/services/cart.service";
import { useAuthStore } from "@/stores/auth.store";
import type { MyOrderListItem, OrderTab } from "@/types/order.types";
import { useRelatedProductsFromMyOrders } from "@/hooks/use-products";

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
  return "bg-white text-neutral-700 border-neutral-200 dark:bg-black dark:text-neutral-200 dark:border-neutral-800";
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
  return "bg-white text-neutral-700 border-neutral-200 dark:bg-black dark:text-neutral-200 dark:border-neutral-800";
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
  return "bg-white text-neutral-700 border-neutral-200 dark:bg-black dark:text-neutral-200 dark:border-neutral-800";
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
      className="group cursor-pointer rounded-sm border border-neutral-200 bg-white shadow-sm transition-all hover:-translate-y-px hover:shadow-md focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:border-neutral-800 dark:bg-neutral-900 dark:focus:ring-white/15"
      aria-label={`Mở chi tiết đơn hàng ${order.orderCode ?? order.id}`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Order ID
          </p>
          <p className="mt-0.5 truncate text-sm font-bold text-neutral-900 dark:text-white">
            #{order.orderCode ?? order.id}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 text-right">
          <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-600 dark:border-neutral-800 dark:bg-black dark:text-neutral-300">
            {formatDate(order.createdAt)}
          </span>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusBadge(
              order.status,
            )}`}
          >
            {statusLabel(order.status)}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="rounded-sm border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-black">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-white ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800">
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
              <p className="line-clamp-2 text-sm font-semibold leading-6 text-neutral-900 dark:text-white">
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
                <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-600 dark:border-neutral-800 dark:bg-black dark:text-neutral-300">
                  {order.payment.method ?? "COD"}
                </span>
                <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-600 dark:border-neutral-800 dark:bg-black dark:text-neutral-300">
                  {paymentSummaryLabel(order)}
                </span>

                {order.refund ? (
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${refundBadge(
                      order.refund.status,
                    )}`}
                  >
                    {refundStatusLabel(order.refund.status)}
                  </span>
                ) : null}

                {order.cancelRequest ? (
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${cancelRequestBadge(
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

      <div className="flex items-center justify-between gap-3 border-t border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
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
              className="inline-flex h-9 items-center rounded-sm border border-neutral-900 bg-white px-3 text-xs font-semibold text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-100 dark:bg-black dark:text-neutral-100 dark:hover:bg-white dark:hover:text-black"
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
              className="inline-flex h-9 items-center rounded-sm border border-black bg-white px-3 text-xs font-semibold text-black transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-white dark:bg-black dark:text-white dark:hover:bg-white dark:hover:text-black"
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
              className="inline-flex h-9 items-center rounded-sm border border-neutral-900 bg-white px-3 text-xs font-semibold text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-100 dark:bg-black dark:text-neutral-100 dark:hover:bg-white dark:hover:text-black"
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
            className="inline-flex h-9 items-center rounded-sm bg-black px-4 text-xs font-semibold text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            Details
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
  const relatedProductsQuery = useRelatedProductsFromMyOrders(
    12,
    Boolean(isAuthenticated),
  );
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

  useEffect(() => {
    setPage(1);
  }, [tab]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

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

  const closeDetailModal = () => {
    setOpenOrderId(null);
    const next = new URLSearchParams(searchParams.toString());
    next.delete("orderId");
    const qs = next.toString();
    router.replace(qs ? `/orders?${qs}` : "/orders", { scroll: false });
  };

  useEffect(() => {
    if (orderIdFromUrl) {
      setOpenOrderId(orderIdFromUrl);
      return;
    }
    setOpenOrderId(null);
  }, [orderIdFromUrl]);

  useEffect(() => {
    if (!openOrderId) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeDetailModal();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openOrderId, searchParams]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-neutral-900 transition-colors duration-200 dark:bg-black dark:text-white flex flex-col">
      <Header
        isDark={isDark}
        onToggleDarkMode={() => setIsDark((prev) => !prev)}
        cartCount={cartCount}
      />

      <main className="flex-1 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <section className="rounded-sm border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-black sm:p-5">
            <nav
              className="-mx-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5"
              aria-label="Trạng thái đơn hàng"
            >
              <div className="min-w-max border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-6">
                  {tabs.map((t) => {
                    const active = tab === t.key;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => {
                          setTab(t.key);
                        }}
                        className={`relative -mb-px whitespace-nowrap px-1 py-3 text-sm font-semibold transition-colors ${
                          active
                            ? "text-black dark:text-white"
                            : "text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white"
                        }`}
                        aria-current={active ? "page" : undefined}
                      >
                        {t.label}
                        <span
                          className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-opacity ${
                            active
                              ? "bg-black opacity-100 dark:bg-white"
                              : "bg-transparent opacity-0"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </nav>
          </section>

          <div className="mt-6">
            {ordersQuery.isLoading ? (
              <div className="flex items-center gap-2 rounded-sm border border-neutral-200 bg-white p-6 text-sm text-neutral-600 shadow-sm dark:border-neutral-800 dark:bg-black dark:text-neutral-300">
                <Clock3 className="h-4 w-4" />
                Đang tải đơn hàng...
              </div>
            ) : ordersQuery.isError ? (
              <div className="rounded-sm border border-neutral-200 bg-white p-6 text-sm text-neutral-700 shadow-sm dark:border-neutral-800 dark:bg-black dark:text-neutral-200">
                Không thể tải danh sách đơn hàng.
              </div>
            ) : (ordersQuery.data?.items?.length ?? 0) === 0 ? (
              <div className="rounded-sm border border-neutral-200 bg-white p-6 text-sm text-neutral-600 shadow-sm dark:border-neutral-800 dark:bg-black dark:text-neutral-300">
                <div className="mb-2 flex items-center gap-2 text-neutral-900 dark:text-white">
                  <PackageCheck className="h-4 w-4" />
                  <span className="font-semibold">Chưa có đơn hàng</span>
                </div>
                Bạn chưa có đơn hàng nào.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
            <section className="mt-6 flex items-center justify-between rounded-sm border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-black sm:px-5">
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Trang {page} / {totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page <= 1 || ordersQuery.isFetching}
                  className="inline-flex h-9 items-center gap-1 rounded-sm border border-neutral-300 px-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Trước
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={page >= totalPages || ordersQuery.isFetching}
                  className="inline-flex h-9 items-center gap-1 rounded-sm border border-neutral-300 px-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
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
            <section className="mt-10 rounded-sm border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-black sm:p-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
                    Gợi ý cho bạn
                  </p>
                  <h2 className="mt-2 text-lg font-black uppercase tracking-wide text-neutral-900 dark:text-white">
                    Sản phẩm liên quan
                  </h2>
                </div>
              </div>

              <div className="mt-5">
                {relatedProductsQuery.isLoading ? (
                  <div className="rounded-sm border border-neutral-200 bg-white p-4 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-black dark:text-neutral-300">
                    Đang tải gợi ý sản phẩm...
                  </div>
                ) : relatedProductsQuery.isError ? (
                  <div className="rounded-sm border border-neutral-200 bg-white p-4 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-black dark:text-neutral-200">
                    Không thể tải sản phẩm liên quan.
                  </div>
                ) : (relatedProductsQuery.data?.products?.length ?? 0) === 0 ? (
                  <div className="rounded-sm border border-neutral-200 bg-white p-4 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-black dark:text-neutral-300">
                    Chưa có gợi ý sản phẩm phù hợp.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {(relatedProductsQuery.data?.products ?? []).map((p) => (
                      <Link
                        key={p.id}
                        href={`/product/${p.id}`}
                        className="group overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-sm transition-transform hover:-translate-y-px hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
                      >
                        <div className="aspect-4/5 w-full overflow-hidden bg-neutral-50 dark:bg-neutral-950">
                          {p.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500 dark:text-neutral-400">
                              Không có ảnh
                            </div>
                          )}
                        </div>

                        <div className="p-3">
                          <p className="line-clamp-2 text-sm font-semibold uppercase text-neutral-900 group-hover:text-neutral-600 dark:text-white dark:group-hover:text-neutral-300">
                            {p.name}
                          </p>
                          <p className="mt-2 text-sm font-black text-neutral-900 dark:text-white">
                            {formatMoney(String(p.minPrice))}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </section>
          ) : null}
        </div>
      </main>

      {openOrderId ? (
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
            <div className="relative w-full max-w-5xl overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-black">
              <button
                type="button"
                onClick={closeDetailModal}
                className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-sm border border-neutral-200 bg-white text-neutral-900 transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:border-neutral-800 dark:bg-black dark:text-white dark:hover:bg-neutral-900 dark:focus:ring-white/15"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="max-h-[82vh] overflow-y-auto pt-14 sm:pt-16">
                <OrderDetailClient
                  orderId={openOrderId}
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
