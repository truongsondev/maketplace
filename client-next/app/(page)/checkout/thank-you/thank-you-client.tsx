"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Header } from "@/components/page/header";
import { Footer } from "@/components/page/footer";
import { RecommendationShelf } from "@/components/page/recommendation-shelf";
import { cartService } from "@/services/cart.service";
import { trackingService } from "@/services/tracking.service";
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
  const [isPayloadResolved, setIsPayloadResolved] = useState(false);
  const [payload, setPayload] = useState<StoredCheckoutPayload | null>(null);
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

  useEffect(() => {
    setIsPayloadResolved(false);

    const orderCode =
      orderCodeFromUrl ||
      window.sessionStorage.getItem("checkout:lastOrderCode");

    if (!orderCode) {
      setPayload(null);
      setIsPayloadResolved(true);
      return;
    }

    try {
      const raw = window.sessionStorage.getItem(`checkout:${orderCode}`);
      if (!raw) {
        setPayload(null);
      } else {
        setPayload(JSON.parse(raw) as StoredCheckoutPayload);
      }
    } catch {
      setPayload(null);
    } finally {
      setIsPayloadResolved(true);
    }
  }, [orderCodeFromUrl]);

  useEffect(() => {
    if (!payload) return;

    payload.items.forEach((item, index) => {
      if (!item.productId) return;
      void trackingService.track({
        eventType: "PURCHASE",
        productId: item.productId,
        orderId: payload.orderId,
        source: "thank_you_page",
        placement: "checkout_success",
        dedupeKey: `purchase:${payload.orderId}:${item.productId}:${index}`,
        metadata: {
          quantity: item.quantity,
          subtotal: item.subtotal,
          orderCode: payload.orderCode,
        },
      });
    });
  }, [payload]);

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
    <div className="luxury-page flex min-h-screen flex-col overflow-x-hidden transition-colors duration-200">
      <Header
        isDark={isDark}
        onToggleDarkMode={() => setIsDark((prev) => !prev)}
        cartCount={cartCount}
        variant="solid"
      />

      <main className="luxury-container flex-1 pb-20 pt-34">
        <div className="mx-auto w-full max-w-6xl">
          {!isPayloadResolved ? (
            <section className="luxury-panel p-6 sm:p-8">
              <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
                Đang tải thông tin đơn hàng...
              </h1>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                Vui lòng chờ trong giây lát.
              </p>
            </section>
          ) : !payload ? (
            <section className="luxury-panel p-6 sm:p-8">
              <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
                Cảm ơn bạn!
              </h1>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                Không tìm thấy thông tin đơn hàng trong phiên hiện tại.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/cart"
                  className="luxury-button inline-flex h-11 items-center justify-center px-6"
                >
                  Về giỏ hàng
                </Link>
                <Link
                  href="/"
                  className="luxury-button-ghost inline-flex h-11 items-center justify-center px-6"
                >
                  Tiếp tục mua sắm
                </Link>
              </div>
            </section>
          ) : (
            <>
              <header className="border border-emerald-200 bg-emerald-50/80 p-6 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20 sm:p-8">
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
                <article className="luxury-panel p-6 sm:p-8 lg:col-span-2">
                  <h2 className="text-lg font-semibold">Sản phẩm</h2>

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
                  <article className="luxury-panel p-6 sm:p-8">
                    <h2 className="text-lg font-semibold">
                      Thông tin đơn hàng
                    </h2>

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

                  <article className="luxury-panel p-6 sm:p-8">
                    <h2 className="text-lg font-semibold">Giao hàng</h2>

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
                      className="luxury-button inline-flex h-11 items-center justify-center px-6"
                    >
                      Tiếp tục mua sắm
                    </Link>
                    <Link
                      href="/cart"
                      className="luxury-button-ghost inline-flex h-11 items-center justify-center px-6"
                    >
                      Về giỏ hàng
                    </Link>
                  </div>
                </aside>
              </section>

              <section className="mt-8">
                <RecommendationShelf
                  kind="personalized"
                  placement="thank_you_recommendations"
                  title="Có thể bạn muốn mua thêm"
                  enabled={Boolean(isAuthenticated)}
                  emptyMessage="AI sẽ gợi ý thêm ngay khi có đủ tín hiệu mua sắm."
                />
              </section>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
