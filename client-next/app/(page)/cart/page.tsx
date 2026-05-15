"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronRight,
  X,
  Search,
  ShoppingCart,
  Ticket,
  Trash2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { CartItemCard } from "@/components/page/cart";
import { RecommendationShelf } from "@/components/page/recommendation-shelf";
import {
  useCart,
  useRemoveCartItem,
  useUpdateCartItem,
} from "@/hooks/use-cart";
import type { CartItem } from "@/services/cart.service";
import {
  voucherService,
  type VoucherValidationResult,
  type VoucherSummary,
} from "@/services/voucher.service";
import type { ApiErrorResponse } from "@/types/api.types";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth.store";

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

function CartBreadcrumb() {
  return (
    <nav aria-label="Breadcrumb" className="mb-5">
      <ol className="inline-flex items-center gap-1 md:gap-2 text-sm">
        <li>
          <Link
            href="/"
            className="font-medium text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
          >
            Trang chủ
          </Link>
        </li>
        <li className="inline-flex items-center gap-1 md:gap-2">
          <ChevronRight className="size-4 text-neutral-400" />
          <span className="font-semibold text-neutral-900 dark:text-white">
            Giỏ hàng
          </span>
        </li>
      </ol>
    </nav>
  );
}

function CartLoading() {
  return (
    <main className="luxury-container py-12">
      <CartBreadcrumb />
      <div className="animate-pulse space-y-4">
        <div className="luxury-skeleton h-8 w-48" />
        <div className="luxury-skeleton h-32" />
        <div className="luxury-skeleton h-32" />
      </div>
    </main>
  );
}

function CartError({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="luxury-container py-12">
      <CartBreadcrumb />
      <div className="luxury-panel p-10 text-center">
        <p className="text-red-600 dark:text-red-400 font-semibold">
          Không tải được giỏ hàng
        </p>
        <button onClick={onRetry} className="luxury-button mt-5">
          Thử lại
        </button>
      </div>
    </main>
  );
}

function CartEmpty() {
  return (
    <main className="luxury-page px-4 py-12">
      <CartBreadcrumb />
      <div className="mx-auto grid max-w-6xl overflow-hidden bg-neutral-950 text-white md:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col justify-center px-6 py-12 text-left md:px-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/55">
            Shopping bag
          </p>
          <h1 className="mt-5 text-5xl font-semibold uppercase leading-[0.92] tracking-[-0.05em] md:text-7xl">
            Bộ sưu tập của bạn đang chờ được hoàn thiện
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/68">
            Lưu lại những item đầu tiên để AURA có thể gợi ý cách phối sát gu
            hơn cho lần mua tiếp theo.
          </p>
          <Link href="/" className="luxury-button mt-8 w-fit">
            Khám phá bản tuyển chọn
          </Link>
        </div>
        <div className="relative min-h-[360px] bg-[#f7f3ec]">
          <div className="absolute inset-8 border border-white/30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ShoppingCart className="size-20 text-white/60" />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CartPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data: cart, isLoading, isError, refetch } = useCart();
  const updateMutation = useUpdateCartItem();
  const removeMutation = useRemoveCartItem();
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const initializedCartIdRef = useRef<string | null>(null);

  const [voucherCode, setVoucherCode] = useState<string>("");
  const [voucherResult, setVoucherResult] =
    useState<VoucherValidationResult | null>(null);
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [openVoucherModal, setOpenVoucherModal] = useState(false);

  const updatingItemId = updateMutation.isPending
    ? updateMutation.variables?.itemId
    : undefined;
  const removingItemId = removeMutation.isPending
    ? removeMutation.variables?.itemId
    : undefined;

  const selectedCount = useMemo(
    () =>
      cart?.items.filter((item) => selectedItemIds.includes(item.itemId))
        .length ?? 0,
    [cart?.items, selectedItemIds],
  );

  const hasSelection = selectedItemIds.length > 0;

  const selectedTotal = useMemo(() => {
    if (!cart || selectedItemIds.length === 0) return 0;

    return cart.items
      .filter((item) => selectedItemIds.includes(item.itemId))
      .reduce((sum, item) => sum + item.subtotal, 0);
  }, [cart, selectedItemIds]);

  const cartBaseTotal = cart?.totalAmount ?? 0;
  const effectiveTotal = hasSelection ? selectedTotal : cartBaseTotal;

  const discountAmount = voucherResult?.pricing.discountAmount ?? 0;
  const discountedTotal = voucherResult?.pricing.finalTotal ?? effectiveTotal;

  const vouchersQuery = useQuery({
    queryKey: ["active-vouchers", "cart"],
    queryFn: () => voucherService.getActiveVouchers(),
    enabled: openVoucherModal,
    staleTime: 60 * 1000,
    retry: 1,
  });

  const eligibleVouchers: VoucherSummary[] = useMemo(() => {
    const list = vouchersQuery.data ?? [];
    const now = Date.now();

    const isEligible = (voucher: VoucherSummary) => {
      const minAmount = voucher.minOrderAmount ?? 0;
      const startAt = Date.parse(voucher.startAt);
      const endAt = Date.parse(voucher.endAt);
      const inTimeRange =
        Number.isFinite(startAt) && Number.isFinite(endAt)
          ? startAt <= now && now <= endAt
          : true;

      return (
        Boolean(voucher.isActive) && inTimeRange && discountedTotal >= minAmount
      );
    };

    return [...list].sort((a, b) => {
      const ae = isEligible(a);
      const be = isEligible(b);
      if (ae === be) return 0;
      return ae ? -1 : 1;
    });
  }, [discountedTotal, vouchersQuery.data]);

  // Keep voucher result consistent with cart selection.
  useEffect(() => {
    setVoucherResult(null);
  }, [selectedItemIds, cart?.cartId, cart?.totalAmount, cart?.totalItems]);

  // Default-select all items when opening a cart for the first time,
  // then keep selection in sync with existing item ids.
  useEffect(() => {
    if (!cart) return;

    const allItemIds = cart.items.map((item) => item.itemId);

    if (initializedCartIdRef.current !== cart.cartId) {
      initializedCartIdRef.current = cart.cartId;
      setSelectedItemIds(allItemIds);
      return;
    }

    setSelectedItemIds((prev) =>
      prev.filter((itemId) => allItemIds.includes(itemId)),
    );
  }, [cart]);

  if (isLoading) return <CartLoading />;
  if (isError || !cart) return <CartError onRetry={() => refetch()} />;
  if (cart.items.length === 0) return <CartEmpty />;

  const clearVoucher = () => {
    setVoucherResult(null);
    setVoucherCode("");
  };

  const applyVoucherCode = async (code: string): Promise<boolean> => {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) {
      toast.error("Vui lòng nhập mã voucher");
      return false;
    }

    try {
      setIsApplyingVoucher(true);
      const payload = {
        code: normalizedCode,
        cartItemIds: hasSelection ? selectedItemIds : undefined,
      };
      const result = await voucherService.applyVoucher(payload);
      setVoucherCode(result.voucher.code);
      setVoucherResult(result);
      toast.success(`Đã áp dụng voucher ${result.voucher.code}`);
      return true;
    } catch (error) {
      const apiError = error as ApiErrorResponse;
      setVoucherResult(null);
      toast.error("Không thể áp dụng voucher", {
        description: apiError?.error?.message ?? "Vui lòng kiểm tra lại mã.",
      });
      return false;
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleCheckout = () => {
    if (discountedTotal <= 0) {
      toast.error("Số tiền thanh toán không hợp lệ");
      return;
    }

    const params = new URLSearchParams();
    if (hasSelection) {
      params.set("items", selectedItemIds.join(","));
    }

    if (voucherResult?.voucher.code) {
      params.set("voucher", voucherResult.voucher.code);
    }

    const query = params.toString();
    router.push(query ? `/checkout/confirm?${query}` : "/checkout/confirm");
  };

  const handleDecrease = (item: CartItem) => {
    if (item.quantity <= 1) return;

    updateMutation.mutate({
      itemId: item.itemId,
      quantity: item.quantity - 1,
    });
  };

  const handleIncrease = (item: CartItem) => {
    if (item.quantity >= item.maxAllowedQuantity) {
      toast.warning("Đã đạt giới hạn tồn kho", {
        description:
          item.maxAllowedQuantity > 0
            ? `Bạn chỉ có thể mua tối đa ${item.maxAllowedQuantity} sản phẩm của biến thể này.`
            : "Biến thể này hiện đã hết hàng.",
      });
      return;
    }

    updateMutation.mutate({
      itemId: item.itemId,
      quantity: item.quantity + 1,
    });
  };

  const handleRemove = (item: CartItem) => {
    removeMutation.mutate({ itemId: item.itemId });
    setSelectedItemIds((prev) => prev.filter((id) => id !== item.itemId));
  };

  const handleToggleSelect = (item: CartItem) => {
    setSelectedItemIds((prev) =>
      prev.includes(item.itemId)
        ? prev.filter((id) => id !== item.itemId)
        : [...prev, item.itemId],
    );
  };

  const handleDeleteSelected = () => {
    if (selectedItemIds.length === 0 || removeMutation.isPending) return;

    Promise.allSettled(
      selectedItemIds.map((itemId) => removeMutation.mutateAsync({ itemId })),
    ).then((results) => {
      const failed = results.filter(
        (item) => item.status === "rejected",
      ).length;
      if (failed === 0) {
        toast.success("Đã xóa các sản phẩm đã chọn");
      } else {
        toast.error(`Có ${failed} sản phẩm chưa thể xóa. Vui lòng thử lại.`);
      }
      setSelectedItemIds([]);
    });
  };

  const isAllSelected =
    cart.items.length > 0 && selectedCount === cart.items.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedItemIds([]);
      return;
    }

    setSelectedItemIds(cart.items.map((item) => item.itemId));
  };

  return (
    <main className="luxury-page pb-36 sm:pb-28">
      <header className="border-b border-black/10 bg-[#f7f3ec] dark:border-white/10 dark:bg-neutral-950">
        <div className="luxury-container flex items-center justify-between gap-4 py-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-3xl font-semibold tracking-[0.28em] text-black dark:text-white"
            >
              AURA
            </Link>
            <span className="text-neutral-300">|</span>
            <h1 className="text-xl font-semibold uppercase tracking-[0.18em] text-neutral-700 dark:text-neutral-200">
              Giỏ hàng
            </h1>
          </div>

          <div className="hidden w-full max-w-xl items-center border border-black/10 bg-white/55 dark:border-white/10 dark:bg-white/5 md:flex">
            <input
              placeholder="Freeship 0đ (*)"
              className="h-11 flex-1 bg-transparent px-4 text-sm text-neutral-700 outline-none dark:text-neutral-100"
            />
            <button className="flex h-11 w-14 items-center justify-center bg-black text-white transition-colors hover:bg-neutral-800">
              <Search className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="luxury-container py-8">
        <div className="mb-4">
          <CartBreadcrumb />
        </div>

        <div className="mb-3 hidden grid-cols-[1.7fr_0.6fr_0.6fr_0.7fr_0.5fr] border-y border-black/10 px-4 py-4 text-sm uppercase tracking-[0.16em] text-neutral-500 dark:border-white/10 dark:text-neutral-400 lg:grid">
          <span>Sản phẩm</span>
          <span className="text-center">Đơn giá</span>
          <span className="text-center">Số lượng</span>
          <span className="text-center">Số tiền</span>
          <span className="text-center">Thao tác</span>
        </div>

        <section className="overflow-hidden border-y border-black/10 dark:border-white/10">
          <div className="flex flex-col gap-2 border-b border-black/10 px-4 py-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-neutral-700 dark:text-neutral-200">
              Sản phẩm trong giỏ ({cart.totalItems})
            </p>
            <div className="flex items-center justify-end gap-3 sm:justify-start">
              <button
                onClick={handleToggleSelectAll}
                className="text-[11px] sm:text-xs font-bold uppercase tracking-wide text-neutral-600 hover:text-black dark:hover:text-white transition-colors"
              >
                {isAllSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={
                  selectedItemIds.length === 0 || removeMutation.isPending
                }
                className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wide text-red-500 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="size-3.5" />
                Xóa đã chọn
              </button>
            </div>
          </div>

          <div className="space-y-0">
            {cart.items.map((item) => (
              <CartItemCard
                key={item.itemId}
                item={item}
                selected={selectedItemIds.includes(item.itemId)}
                isUpdating={updatingItemId === item.itemId}
                isRemoving={removingItemId === item.itemId}
                onToggleSelect={handleToggleSelect}
                onDecrease={handleDecrease}
                onIncrease={handleIncrease}
                onRemove={handleRemove}
              />
            ))}
          </div>

          <div className="border-t border-black/10 px-4 py-4 dark:border-white/10">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setOpenVoucherModal(true)}
                className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-neutral-900 hover:underline dark:text-white"
              >
                <Ticket className="size-4" />
                Private offer
              </button>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <input
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  placeholder="Nhập mã ưu đãi"
                  className="luxury-field h-10 w-full py-0 sm:w-64"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => void applyVoucherCode(voucherCode)}
                    disabled={isApplyingVoucher}
                    className="luxury-button h-10 px-4 py-0"
                  >
                    Áp dụng
                  </button>
                  {voucherResult ? (
                    <button
                      onClick={clearVoucher}
                      className="luxury-button-ghost h-10 px-3 py-0"
                    >
                      Gỡ mã
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            {voucherResult ? (
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                Đã áp dụng{" "}
                <span className="font-semibold">
                  {voucherResult.voucher.code}
                </span>{" "}
                • Giảm{" "}
                <span className="font-semibold">
                  {formatPrice(discountAmount)}
                </span>
              </p>
            ) : null}
          </div>

          <div className="border-t border-black/10 px-4 py-3 text-sm text-neutral-600 dark:border-white/10 dark:text-neutral-300">
            Giảm 500.000đ phí vận chuyển đơn tối thiểu 0đ
            <button className="ml-2 text-black dark:text-white hover:underline">
              Tìm hiểu thêm
            </button>
          </div>
        </section>

        {isAuthenticated ? (
          <section className="mt-6">
            <RecommendationShelf
              kind="cart"
              placement="cart_recommendations"
              title="Gợi ý phối cùng shopping bag"
              enabled={Boolean(isAuthenticated)}
              emptyMessage="Thêm thêm vài tương tác nữa để AURA chọn phối đồ sát mood hơn."
            />
          </section>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-black/10 bg-[#f7f3ec]/92 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/92">
        <div className="luxury-container py-3">
          <div className="flex items-start gap-3 sm:items-center sm:gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-neutral-700 dark:text-neutral-200">
                <button
                  onClick={handleToggleSelectAll}
                  className="hover:text-black dark:hover:text-white"
                >
                  {isAllSelected
                    ? "Bỏ chọn tất cả"
                    : `Chọn tất cả (${cart.totalItems})`}
                </button>
                <button
                  onClick={handleDeleteSelected}
                  disabled={
                    selectedItemIds.length === 0 || removeMutation.isPending
                  }
                  className="hover:text-red-600 disabled:opacity-40"
                >
                  Gỡ
                </button>
                <button className="hover:underline">Giữ lại wishlist</button>
              </div>

              <p className="mt-1 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                Tổng cộng ({hasSelection ? selectedCount : cart.totalItems} sản
                phẩm):
                <span className="ml-1 text-xl font-semibold text-black dark:text-white sm:text-2xl">
                  {formatPrice(discountedTotal)}
                </span>
              </p>
            </div>

            <button
              onClick={handleCheckout}
              disabled={updateMutation.isPending || removeMutation.isPending}
              className="luxury-button h-11 shrink-0 px-4 py-0 sm:px-6"
            >
              Tiếp tục checkout
            </button>
          </div>
        </div>
      </div>

      {openVoucherModal ? (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label="Chọn Shop Voucher"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpenVoucherModal(false)}
          />

          <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-6">
            <div className="luxury-panel relative w-full max-w-2xl overflow-hidden bg-[#f7f3ec] dark:bg-neutral-950">
              <button
                type="button"
                onClick={() => setOpenVoucherModal(false)}
                className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center border border-black/10 bg-white/70 text-neutral-900 transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:focus:ring-white/15"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="border-b border-black/10 px-5 py-5 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Ticket className="size-4 text-neutral-700 dark:text-neutral-200" />
                  <h2 className="text-base font-semibold uppercase tracking-[0.18em] text-neutral-900 dark:text-white">
                    Shop Voucher
                  </h2>
                </div>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                  Chọn voucher phù hợp để áp dụng cho đơn hàng.
                </p>
              </div>

              <div className="max-h-[70vh] overflow-y-auto p-5">
                {vouchersQuery.isLoading ? (
                  <div className="luxury-panel p-4 text-sm text-neutral-600 dark:text-neutral-300">
                    Đang tải voucher...
                  </div>
                ) : vouchersQuery.isError ? (
                  <div className="luxury-panel p-4 text-sm text-neutral-700 dark:text-neutral-200">
                    Không thể tải voucher.
                    <button
                      type="button"
                      onClick={() => void vouchersQuery.refetch()}
                      className="ml-2 font-semibold text-black hover:underline dark:text-white"
                    >
                      Thử lại
                    </button>
                  </div>
                ) : eligibleVouchers.length === 0 ? (
                  <div className="luxury-panel p-4 text-sm text-neutral-600 dark:text-neutral-300">
                    Hiện chưa có voucher phù hợp.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {eligibleVouchers.map((voucher) => {
                      const minAmount = voucher.minOrderAmount ?? 0;
                      const canApply =
                        discountedTotal >= minAmount && voucher.isActive;

                      const valueLabel =
                        voucher.type === "PERCENTAGE"
                          ? `Giảm ${voucher.value}%`
                          : `Giảm ${voucher.value.toLocaleString("vi-VN")}đ`;

                      const conditionLabel =
                        minAmount > 0
                          ? `Đơn tối thiểu ${formatPrice(minAmount)}`
                          : "Áp dụng cho mọi đơn";

                      return (
                        <div key={voucher.id} className="luxury-panel p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-black uppercase text-neutral-900 dark:text-white">
                                {voucher.code}
                              </p>
                              <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-200">
                                {voucher.description || valueLabel}
                              </p>
                              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                                {valueLabel} • {conditionLabel}
                              </p>
                            </div>

                            <button
                              type="button"
                              disabled={isApplyingVoucher || !canApply}
                              onClick={async () => {
                                setVoucherCode(voucher.code);
                                const ok = await applyVoucherCode(voucher.code);
                                if (ok) {
                                  setOpenVoucherModal(false);
                                }
                              }}
                              className="luxury-button h-10 shrink-0 px-4 py-0"
                            >
                              Áp dụng
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
