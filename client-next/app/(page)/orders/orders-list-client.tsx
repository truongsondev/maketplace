"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMyOrderCounts, useMyOrders } from "@/hooks/use-orders";
import type { MyOrderListItem, OrderSort, OrderTab } from "@/types/order.types";

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
    case "CANCELLED":
      return "Đã hủy";
    default:
      return status;
  }
}

function statusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "CONFIRMED":
    case "PAID":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "SHIPPED":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "DELIVERED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "CANCELLED":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-neutral-50 text-neutral-700 border-neutral-200";
  }
}

function OrderCard({ order }: { order: MyOrderListItem }) {
  const first = order.items[0];
  const extraCount = Math.max(order.items.length - 1, 0);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-5 py-4 text-sm dark:border-neutral-700">
        <div className="min-w-0">
          <p className="text-neutral-600 dark:text-neutral-300">
            <span className="font-semibold text-neutral-900 dark:text-white">
              Mã đơn
            </span>
            : {order.orderCode ?? order.id}
          </p>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {formatDate(order.createdAt)}
          </p>
        </div>

        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge(
            order.status,
          )}`}
        >
          {statusLabel(order.status)}
        </span>
      </div>

      <div className="px-5 py-4">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            {first?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={first.imageUrl}
                alt={first.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="text-xs text-neutral-500">No image</div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
              {first?.name ?? "(Không có sản phẩm)"}
            </p>
            {first?.attributesText ? (
              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">
                {first.attributesText}
              </p>
            ) : null}
            {first ? (
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                SL: {first.quantity}
                {extraCount > 0 ? ` • +${extraCount} sản phẩm khác` : ""}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-neutral-600 dark:text-neutral-300">
            <span className="font-semibold text-neutral-900 dark:text-white">
              Tổng tiền:
            </span>{" "}
            {formatMoney(order.totalPrice)}
          </div>

          <Link
            href={`/orders/${encodeURIComponent(order.id)}`}
            className="inline-flex h-10 items-center rounded-xl bg-black px-5 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            Xem chi tiết
          </Link>
        </div>
      </div>
    </div>
  );
}

export function OrdersListClient() {
  const [tab, setTab] = useState<OrderTab>("all");
  const [sort, setSort] = useState<OrderSort>("new");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState<string | undefined>(undefined);

  const countsQuery = useMyOrderCounts();
  const ordersQuery = useMyOrders({ tab, sort, search, page: 1, limit: 10 });

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

  const handleApplySearch = () => {
    const s = searchInput.trim();
    setSearch(s ? s : undefined);
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Đơn mua
          </h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
            Theo dõi trạng thái và quản lý đơn hàng của bạn.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as OrderSort)}
            className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
          >
            <option value="new">Mới nhất</option>
            <option value="old">Cũ nhất</option>
          </select>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                tab === t.key
                  ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                  : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleApplySearch();
            }}
            placeholder="Tìm theo mã đơn / orderCode"
            className="h-10 w-full sm:w-72 rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-neutral-900/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
          />
          <button
            onClick={handleApplySearch}
            className="inline-flex h-10 items-center rounded-xl bg-black px-4 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            Tìm
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {ordersQuery.isLoading ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
            Đang tải đơn hàng...
          </div>
        ) : ordersQuery.isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-200">
            Không thể tải danh sách đơn hàng.
          </div>
        ) : (ordersQuery.data?.items?.length ?? 0) === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
            Bạn chưa có đơn hàng nào.
          </div>
        ) : (
          (ordersQuery.data?.items ?? []).map((order) => (
            <OrderCard key={order.id} order={order} />
          ))
        )}
      </div>
    </main>
  );
}
