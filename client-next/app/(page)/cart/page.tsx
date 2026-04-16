"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import { useRelatedProductsFromMyOrders } from "@/hooks/use-products";
import { useAuthStore } from "@/stores/auth.store";

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

function formatApiPrice(value: string | number) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return String(value);
  return formatPrice(n);
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
    <main className="w-full max-w-330 mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CartBreadcrumb />
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-700 rounded-sm" />
        <div className="h-32 bg-neutral-200 dark:bg-neutral-700 rounded-sm" />
        <div className="h-32 bg-neutral-200 dark:bg-neutral-700 rounded-sm" />
      </div>
    </main>
  );
}

function CartError({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="w-full max-w-330 mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <CartBreadcrumb />
      <div className="rounded-sm border border-neutral-300 bg-white dark:bg-neutral-900 dark:border-neutral-700 p-8 text-center">
        <p className="text-red-600 dark:text-red-400 font-semibold">
          Không tải được giỏ hàng
        </p>
        <button
          onClick={onRetry}
          className="mt-4 h-10 px-5 rounded-sm bg-black text-white font-semibold hover:bg-neutral-800 transition-colors"
        >
          Thử lại
        </button>
      </div>
    </main>
  );
}

function CartEmpty() {
  return (
    <main className="w-full max-w-330 mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <CartBreadcrumb />
      <div className="rounded-sm border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 md:p-10 text-center shadow-sm">
        <div className="mx-auto size-16 rounded-sm bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
          <ShoppingCart className="size-7 text-neutral-500" />
        </div>
        <h1 className="mt-5 text-xl md:text-2xl font-black uppercase text-neutral-900 dark:text-white">
          Giỏ hàng của bạn đang trống
        </h1>
        <p className="mt-2 text-neutral-500 dark:text-neutral-400">
          Hãy thêm sản phẩm yêu thích để tiếp tục mua sắm.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-11 px-5 rounded-sm bg-black text-white font-semibold items-center justify-center hover:bg-neutral-800 transition-colors"
        >
          Quay lại mua sắm
        </Link>
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

  const [voucherCode, setVoucherCode] = useState<string>("");
  const [voucherResult, setVoucherResult] =
    useState<VoucherValidationResult | null>(null);
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [openVoucherModal, setOpenVoucherModal] = useState(false);

  const relatedProductsQuery = useRelatedProductsFromMyOrders(
    12,
    Boolean(isAuthenticated),
  );

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
    if (item.quantity >= 10) return;

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
    <main className="min-h-screen bg-[#f5f5f5] dark:bg-neutral-950 pb-28 text-[#222222] dark:text-neutral-100">
      <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto flex w-full max-w-330 items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-3xl font-black tracking-tight text-black dark:text-white"
            >
              AURA
            </Link>
            <span className="text-neutral-300">|</span>
            <h1 className="text-2xl font-semibold text-neutral-700 dark:text-neutral-200">
              Giỏ hàng
            </h1>
          </div>

          <div className="hidden w-full max-w-xl md:flex items-center rounded-sm border border-neutral-300 bg-white dark:bg-neutral-900 dark:border-neutral-700">
            <input
              placeholder="Freeship 0đ (*)"
              className="h-11 flex-1 bg-transparent px-4 text-sm text-neutral-700 outline-none dark:text-neutral-100"
            />
            <button className="flex h-11 w-14 items-center justify-center bg-black text-white hover:bg-neutral-800 transition-colors">
              <Search className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-330 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4">
          <CartBreadcrumb />
        </div>

        <div className="mb-3 hidden lg:grid grid-cols-[1.7fr_0.6fr_0.6fr_0.7fr_0.5fr] rounded-sm bg-white px-4 py-4 text-base text-neutral-600 shadow-sm dark:bg-neutral-900 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800">
          <span>Sản phẩm</span>
          <span className="text-center">Đơn giá</span>
          <span className="text-center">Số lượng</span>
          <span className="text-center">Số tiền</span>
          <span className="text-center">Thao tác</span>
        </div>

        <section className="overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-700">
            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
              Sản phẩm trong giỏ ({cart.totalItems})
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleSelectAll}
                className="text-xs font-bold uppercase tracking-wide text-neutral-600 hover:text-black dark:hover:text-white transition-colors"
              >
                {isAllSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={
                  selectedItemIds.length === 0 || removeMutation.isPending
                }
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-red-500 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
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

          <div className="border-t border-neutral-200 px-4 py-3 dark:border-neutral-700">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setOpenVoucherModal(true)}
                className="flex items-center gap-2 text-sm font-semibold text-neutral-900 hover:underline dark:text-white"
              >
                <Ticket className="size-4" />
                Shop Voucher
              </button>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <input
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  placeholder="Nhập mã voucher"
                  className="h-10 w-full rounded-sm border border-neutral-300 bg-white px-3 text-sm text-neutral-800 outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 sm:w-64"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => void applyVoucherCode(voucherCode)}
                    disabled={isApplyingVoucher}
                    className="h-10 rounded-sm bg-black px-4 text-sm font-bold text-white hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Áp dụng
                  </button>
                  {voucherResult ? (
                    <button
                      onClick={clearVoucher}
                      className="h-10 rounded-sm border border-neutral-300 px-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                    >
                      Bỏ
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

          <div className="border-t border-neutral-200 px-4 py-3 text-sm text-neutral-600 dark:border-neutral-700 dark:text-neutral-300">
            Giảm 500.000đ phí vận chuyển đơn tối thiểu 0đ
            <button className="ml-2 text-black dark:text-white hover:underline">
              Tìm hiểu thêm
            </button>
          </div>
        </section>

        {isAuthenticated ? (
          <section className="mt-6 rounded-sm border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
              Gợi ý cho bạn
            </p>

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
                          {formatApiPrice(p.minPrice)}
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

      <div className="fixed bottom-0 inset-x-0 z-50 border-t border-neutral-200 bg-white/95 backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/95">
        <div className="mx-auto flex w-full max-w-330 items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <button
            onClick={handleToggleSelectAll}
            className="text-sm text-neutral-700 hover:text-black dark:text-neutral-200 dark:hover:text-white"
          >
            {isAllSelected
              ? "Bỏ chọn tất cả"
              : `Chọn tất cả (${cart.totalItems})`}
          </button>
          <button
            onClick={handleDeleteSelected}
            disabled={selectedItemIds.length === 0 || removeMutation.isPending}
            className="text-sm text-neutral-700 hover:text-red-600 disabled:opacity-40 dark:text-neutral-200"
          >
            Xóa
          </button>
          <button className="text-sm text-black dark:text-white hover:underline">
            Lưu vào mục Đã thích
          </button>

          <div className="ml-auto text-right">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Tổng cộng ({hasSelection ? selectedCount : cart.totalItems} sản
              phẩm):
              <span className="ml-1 text-2xl font-black text-black dark:text-white">
                {formatPrice(discountedTotal)}
              </span>
            </p>
          </div>
          <button
            onClick={handleCheckout}
            disabled={updateMutation.isPending || removeMutation.isPending}
            className="h-11 min-w-40 rounded-sm bg-black px-6 text-white font-bold hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Thanh toán
          </button>
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
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpenVoucherModal(false)}
          />

          <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-6">
            <div className="relative w-full max-w-2xl overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-black">
              <button
                type="button"
                onClick={() => setOpenVoucherModal(false)}
                className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-sm border border-neutral-200 bg-white text-neutral-900 transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:border-neutral-800 dark:bg-black dark:text-white dark:hover:bg-neutral-900 dark:focus:ring-white/15"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <Ticket className="size-4 text-neutral-700 dark:text-neutral-200" />
                  <h2 className="text-base font-black uppercase text-neutral-900 dark:text-white">
                    Shop Voucher
                  </h2>
                </div>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                  Chọn voucher phù hợp để áp dụng cho đơn hàng.
                </p>
              </div>

              <div className="max-h-[70vh] overflow-y-auto p-5">
                {vouchersQuery.isLoading ? (
                  <div className="rounded-sm border border-neutral-200 bg-white p-4 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-black dark:text-neutral-300">
                    Đang tải voucher...
                  </div>
                ) : vouchersQuery.isError ? (
                  <div className="rounded-sm border border-neutral-200 bg-white p-4 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-black dark:text-neutral-200">
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
                  <div className="rounded-sm border border-neutral-200 bg-white p-4 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-black dark:text-neutral-300">
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
                        <div
                          key={voucher.id}
                          className="rounded-sm border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                        >
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
                              className="h-10 shrink-0 rounded-sm bg-black px-4 text-sm font-bold text-white hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
