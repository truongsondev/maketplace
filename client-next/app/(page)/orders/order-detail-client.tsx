"use client";

import Link from "next/link";
import { useCancelMyOrder, useMyOrderDetail } from "@/hooks/use-orders";

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
    case "CANCELLED":
      return "Đã hủy";
    default:
      return status;
  }
}

export function OrderDetailClient({ orderId }: { orderId: string }) {
  const detailQuery = useMyOrderDetail(orderId);
  const cancelMutation = useCancelMyOrder();

  const order = detailQuery.data;

  const canCancel =
    order?.status === "PENDING" || order?.status === "CONFIRMED";

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Chi tiết đơn hàng
          </h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
            {order ? `Cập nhật: ${statusText(order.status)}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/orders"
            className="inline-flex h-10 items-center rounded-xl border border-neutral-300 px-5 text-sm font-semibold text-neutral-700 dark:border-neutral-700 dark:text-neutral-200"
          >
            Quay lại
          </Link>
          <button
            onClick={() => order && cancelMutation.mutate(order.id)}
            disabled={!order || !canCancel || cancelMutation.isPending}
            className="inline-flex h-10 items-center rounded-xl border border-red-200 bg-red-50 px-5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-200"
          >
            Hủy đơn
          </button>
        </div>
      </div>

      {detailQuery.isLoading ? (
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
          Đang tải đơn hàng...
        </div>
      ) : detailQuery.isError || !order ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-200">
          Không thể tải chi tiết đơn hàng.
        </div>
      ) : (
        <>
          <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
            <div className="flex flex-col gap-2 text-sm text-neutral-700 dark:text-neutral-200">
              <p>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  Mã đơn:
                </span>{" "}
                {order.orderCode ?? order.id}
              </p>
              <p>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  Thời gian:
                </span>{" "}
                {formatDate(order.createdAt)}
              </p>
              <p>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  Trạng thái:
                </span>{" "}
                {statusText(order.status)}
              </p>
              <p>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  Thanh toán:
                </span>{" "}
                {order.payment.method ?? "—"} (
                {order.payment.status ?? order.payment.transactionStatus ?? "—"}
                )
              </p>
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Sản phẩm
            </h2>

            <div className="mt-4 space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4 last:border-none last:pb-0 dark:border-neutral-700"
                >
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="text-xs text-neutral-500">No image</div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
                        {item.name}
                      </p>
                      {item.attributesText ? (
                        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">
                          {item.attributesText}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        SL: {item.quantity}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                      {formatMoney(item.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-neutral-200 pt-4 text-sm dark:border-neutral-700">
              <span className="text-neutral-600 dark:text-neutral-300">
                Tổng cộng
              </span>
              <span className="text-base font-bold text-neutral-900 dark:text-white">
                {formatMoney(order.totalPrice)}
              </span>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
