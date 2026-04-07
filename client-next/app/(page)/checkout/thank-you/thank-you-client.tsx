"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

type StoredCheckoutPayload = {
  orderId: string;
  orderCode: string;
  amount: number;
  items: Array<{
    itemId: string;
    productName: string;
    quantity: number;
    subtotal: number;
  }>;
  shipping: {
    recipient: string;
    phone: string;
    addressLine: string;
    ward: string;
    district: string;
    city: string;
  };
  createdAt: string;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

function formatAddress(shipping: StoredCheckoutPayload["shipping"]) {
  const parts = [
    shipping.addressLine,
    shipping.ward,
    shipping.district,
    shipping.city,
  ]
    .map((p) => p?.trim())
    .filter(Boolean);
  return parts.join(", ");
}

export function ThankYouClient() {
  const searchParams = useSearchParams();

  const orderCodeFromUrl = useMemo(() => {
    return searchParams.get("orderCode") || searchParams.get("order_code");
  }, [searchParams]);

  const payload = useMemo(() => {
    if (typeof window === "undefined") return null;

    const orderCode =
      orderCodeFromUrl ||
      window.sessionStorage.getItem("checkout:lastOrderCode");
    if (!orderCode) return null;

    try {
      const raw = window.sessionStorage.getItem(`checkout:${orderCode}`);
      if (!raw) return null;
      return JSON.parse(raw) as StoredCheckoutPayload;
    } catch {
      return null;
    }
  }, [orderCodeFromUrl]);

  if (!payload) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Cảm ơn bạn!
          </h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
            Không tìm thấy thông tin đơn hàng trong phiên hiện tại.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/cart"
              className="inline-flex h-10 items-center rounded-xl bg-black px-5 font-semibold text-white hover:bg-neutral-800"
            >
              Về giỏ hàng
            </Link>
            <Link
              href="/"
              className="inline-flex h-10 items-center rounded-xl border border-neutral-300 px-5 font-semibold text-neutral-700 dark:border-neutral-700 dark:text-neutral-200"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900/40 dark:bg-emerald-950/20">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-6 text-emerald-600 dark:text-emerald-400" />
          <div>
            <h1 className="text-2xl font-bold text-emerald-800 dark:text-emerald-100">
              Thanh toán thành công
            </h1>
            <p className="mt-1 text-sm text-emerald-700/90 dark:text-emerald-200/90">
              Cảm ơn bạn đã đặt hàng. Dưới đây là thông tin đơn hàng.
            </p>
          </div>
        </div>
      </header>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <article className="lg:col-span-2 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Sản phẩm
          </h2>

          <div className="mt-4 space-y-3">
            {payload.items.map((item) => (
              <div
                key={item.itemId}
                className="flex items-start justify-between gap-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-neutral-900 dark:text-white">
                    {item.productName}
                  </p>
                  <p className="mt-0.5 text-neutral-500 dark:text-neutral-400">
                    SL: {item.quantity}
                  </p>
                </div>
                <p className="whitespace-nowrap font-semibold text-neutral-900 dark:text-white">
                  {formatPrice(item.subtotal)}
                </p>
              </div>
            ))}
          </div>
        </article>

        <aside className="space-y-4">
          <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Thông tin đơn hàng
            </h2>

            <div className="mt-4 space-y-2 text-sm text-neutral-700 dark:text-neutral-200">
              <p>
                <span className="font-semibold">Mã đơn:</span>{" "}
                {payload.orderCode}
              </p>
              <p>
                <span className="font-semibold">Mã hệ thống:</span>{" "}
                {payload.orderId}
              </p>
              <p>
                <span className="font-semibold">Tổng tiền:</span>{" "}
                {formatPrice(payload.amount)}
              </p>
            </div>
          </article>

          <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Giao hàng
            </h2>

            <div className="mt-4 space-y-2 text-sm text-neutral-700 dark:text-neutral-200">
              <p>
                <span className="font-semibold">Người nhận:</span>{" "}
                {payload.shipping.recipient}
              </p>
              <p>
                <span className="font-semibold">SĐT:</span>{" "}
                {payload.shipping.phone}
              </p>
              <p>
                <span className="font-semibold">Địa chỉ:</span>{" "}
                {formatAddress(payload.shipping)}
              </p>
            </div>
          </article>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex h-10 items-center rounded-xl bg-black px-5 font-semibold text-white hover:bg-neutral-800"
            >
              Tiếp tục mua sắm
            </Link>
            <Link
              href="/cart"
              className="inline-flex h-10 items-center rounded-xl border border-neutral-300 px-5 font-semibold text-neutral-700 dark:border-neutral-700 dark:text-neutral-200"
            >
              Về giỏ hàng
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}
