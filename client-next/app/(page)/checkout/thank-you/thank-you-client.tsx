"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Header } from "@/components/page/header";
import { Footer } from "@/components/page/footer";
import { cartService } from "@/services/cart.service";
import { useAuthStore } from "@/stores/auth.store";

type StoredCheckoutPayload = {
  orderId: string;
  orderCode: string;
  amount: number;
  pricing?: {
    subtotalAmount: number;
    discountAmount: number;
    totalAmount: number;
    voucherCode?: string | null;
  };
  items: Array<{
    itemId: string;
    productId?: string;
    productName: string;
    variantId?: string;
    variantSku?: string;
    variantAttributes?: Record<string, string>;
    quantity: number;
    unitPrice?: number;
    subtotal: number;
    image?: {
      url: string;
      altText: string;
    } | null;
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

function formatVariantAttributes(
  attrs: Record<string, string> | undefined,
): string {
  if (!attrs) return "";
  const entries = Object.entries(attrs)
    .map(([k, v]) => [k?.trim(), v?.trim()] as const)
    .filter(([k, v]) => Boolean(k) && Boolean(v));
  if (entries.length === 0) return "";
  return entries.map(([k, v]) => `${k}: ${v}`).join(" • ");
}

export function ThankYouClient() {
  const searchParams = useSearchParams();
  const [isDark, setIsDark] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { data: cartSummary } = useQuery({
    queryKey: ["cart", "summary"],
    queryFn: () => cartService.getCartSummary(),
    enabled: isAuthenticated,
    retry: false,
    staleTime: 1000 * 30,
  });

  const cartCount = useMemo(() => cartSummary?.totalItems ?? 0, [cartSummary]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

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

  const itemsPricing = useMemo(() => {
    if (!payload) return null;

    const items = payload.items;
    const subtotalAmount =
      payload.pricing?.subtotalAmount ??
      items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const discountAmount = payload.pricing?.discountAmount ?? 0;

    if (!discountAmount || subtotalAmount <= 0 || items.length === 0) {
      return {
        subtotalAmount,
        discountAmount: 0,
        itemDiscounts: items.map(() => 0),
      };
    }

    let allocated = 0;
    const itemDiscounts = items.map((item, index) => {
      if (index === items.length - 1) {
        return Math.max(0, discountAmount - allocated);
      }

      const raw = (item.subtotal / subtotalAmount) * discountAmount;
      const floored = Math.max(0, Math.floor(raw));
      allocated += floored;
      return floored;
    });

    return {
      subtotalAmount,
      discountAmount,
      itemDiscounts,
    };
  }, [payload]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-neutral-900 transition-colors duration-200 dark:bg-black dark:text-white flex flex-col">
      <Header
        isDark={isDark}
        onToggleDarkMode={() => setIsDark((prev) => !prev)}
        cartCount={cartCount}
      />

      <main className="flex-1 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">
          {!payload ? (
            <section className="rounded-sm border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-black sm:p-8">
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                Cảm ơn bạn!
              </h1>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                Không tìm thấy thông tin đơn hàng trong phiên hiện tại.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/cart"
                  className="inline-flex h-11 items-center justify-center rounded-sm bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
                >
                  Về giỏ hàng
                </Link>
                <Link
                  href="/"
                  className="inline-flex h-11 items-center justify-center rounded-sm border border-neutral-200 bg-white px-6 text-sm font-bold text-neutral-900 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-black dark:text-white dark:hover:bg-neutral-900"
                >
                  Tiếp tục mua sắm
                </Link>
              </div>
            </section>
          ) : (
            <>
              <header className="rounded-sm border border-emerald-200 bg-emerald-50 p-6 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20 sm:p-8">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-6 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700/80 dark:text-emerald-200/80">
                      Thanh toán
                    </p>
                    <h1 className="mt-1 text-2xl font-black text-emerald-900 dark:text-emerald-100 sm:text-3xl">
                      Thanh toán thành công
                    </h1>
                    <p className="mt-2 text-sm text-emerald-800/90 dark:text-emerald-200/90">
                      Cảm ơn bạn đã đặt hàng. Dưới đây là thông tin đơn hàng.
                    </p>
                  </div>
                </div>
              </header>

              <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <article className="lg:col-span-2 rounded-sm border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-black sm:p-8">
                  <h2 className="text-lg font-bold">Sản phẩm</h2>

                  <div className="mt-5 space-y-3">
                    {payload.items.map((item, index) => {
                      const itemDiscount =
                        itemsPricing?.itemDiscounts?.[index] ?? 0;
                      const finalSubtotal = Math.max(
                        0,
                        item.subtotal - itemDiscount,
                      );

                      const originalUnitPrice =
                        item.unitPrice && item.unitPrice > 0
                          ? item.unitPrice
                          : item.quantity > 0
                            ? item.subtotal / item.quantity
                            : item.subtotal;
                      const finalUnitPrice =
                        item.quantity > 0
                          ? finalSubtotal / item.quantity
                          : finalSubtotal;

                      const hasDiscount = itemDiscount > 0;

                      return (
                        <div
                          key={item.itemId}
                          className="flex items-start justify-between gap-3 text-sm"
                        >
                          <div className="min-w-0 flex items-start gap-3">
                            {item.image?.url ? (
                              <div className="relative size-14 shrink-0 overflow-hidden rounded-sm border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-black">
                                <Image
                                  src={item.image.url}
                                  alt={
                                    item.image.altText ||
                                    item.productName ||
                                    "Sản phẩm"
                                  }
                                  fill
                                  sizes="56px"
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="size-14 shrink-0 rounded-sm border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900" />
                            )}

                            <div className="min-w-0">
                              <p className="truncate font-semibold text-neutral-900 dark:text-white">
                                {item.productName}
                              </p>

                              {item.variantSku ? (
                                <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
                                  SKU: {item.variantSku}
                                </p>
                              ) : null}

                              {item.variantAttributes ? (
                                <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
                                  {formatVariantAttributes(
                                    item.variantAttributes,
                                  )}
                                </p>
                              ) : null}

                              <p className="mt-0.5 text-neutral-500 dark:text-neutral-400">
                                SL: {item.quantity}
                                {originalUnitPrice ? (
                                  <> • Giá: {formatPrice(originalUnitPrice)}</>
                                ) : null}
                                {hasDiscount ? (
                                  <> → {formatPrice(finalUnitPrice)}</>
                                ) : null}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {hasDiscount ? (
                              <p className="whitespace-nowrap text-xs text-neutral-400 line-through dark:text-neutral-500">
                                {formatPrice(item.subtotal)}
                              </p>
                            ) : null}
                            <p className="whitespace-nowrap font-semibold text-neutral-900 dark:text-white">
                              {formatPrice(
                                hasDiscount ? finalSubtotal : item.subtotal,
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>

                <aside className="space-y-4">
                  <article className="rounded-sm border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-black sm:p-8">
                    <h2 className="text-lg font-bold">Thông tin đơn hàng</h2>

                    <div className="mt-5 space-y-2 text-sm text-neutral-700 dark:text-neutral-200">
                      <p>
                        <span className="font-semibold">Mã đơn:</span>{" "}
                        {payload.orderCode}
                      </p>
                      <p>
                        <span className="font-semibold">Mã hệ thống:</span>{" "}
                        {payload.orderId}
                      </p>
                      {payload.pricing?.voucherCode ? (
                        <p>
                          <span className="font-semibold">Voucher:</span>{" "}
                          {payload.pricing.voucherCode}
                        </p>
                      ) : null}
                      {itemsPricing ? (
                        <>
                          <p>
                            <span className="font-semibold">Tạm tính:</span>{" "}
                            {formatPrice(itemsPricing.subtotalAmount)}
                          </p>
                          {itemsPricing.discountAmount > 0 ? (
                            <p>
                              <span className="font-semibold">
                                Giảm voucher:
                              </span>{" "}
                              -{formatPrice(itemsPricing.discountAmount)}
                            </p>
                          ) : null}
                        </>
                      ) : null}
                      <p>
                        <span className="font-semibold">Tổng thanh toán:</span>{" "}
                        {formatPrice(
                          payload.pricing?.totalAmount ?? payload.amount,
                        )}
                      </p>
                    </div>
                  </article>

                  <article className="rounded-sm border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-black sm:p-8">
                    <h2 className="text-lg font-bold">Giao hàng</h2>

                    <div className="mt-5 space-y-2 text-sm text-neutral-700 dark:text-neutral-200">
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
                      className="inline-flex h-11 items-center justify-center rounded-sm bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
                    >
                      Tiếp tục mua sắm
                    </Link>
                    <Link
                      href="/cart"
                      className="inline-flex h-11 items-center justify-center rounded-sm border border-neutral-200 bg-white px-6 text-sm font-bold text-neutral-900 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-black dark:text-white dark:hover:bg-neutral-900"
                    >
                      Về giỏ hàng
                    </Link>
                  </div>
                </aside>
              </section>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
