"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ChevronRight,
  Loader2,
  Search,
  ShoppingCart,
  Ticket,
  Trash2,
} from "lucide-react";
import { CartItemCard } from "@/components/page/cart";
import {
  useCart,
  useRemoveCartItem,
  useUpdateCartItem,
} from "@/hooks/use-cart";
import type { CartItem } from "@/services/cart.service";
import { useCreateVnpayPaymentUrl } from "@/hooks/use-vnpay-payment";
import { toast } from "sonner";

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
            className="font-medium text-slate-500 hover:text-primary transition-colors"
          >
            Trang chủ
          </Link>
        </li>
        <li className="inline-flex items-center gap-1 md:gap-2">
          <ChevronRight className="size-4 text-slate-400" />
          <span className="font-semibold text-slate-900 dark:text-white">
            Giỏ hàng
          </span>
        </li>
      </ol>
    </nav>
  );
}

function CartLoading() {
  return (
    <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CartBreadcrumb />
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-3xl" />
        <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-3xl" />
      </div>
    </main>
  );
}

function CartError({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <CartBreadcrumb />
      <div className="rounded-3xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 p-8 text-center">
        <p className="text-red-600 dark:text-red-400 font-semibold">
          Không tải được giỏ hàng
        </p>
        <button
          onClick={onRetry}
          className="mt-4 h-10 px-5 rounded-lg bg-primary text-white font-semibold hover:bg-orange-600 transition-colors"
        >
          Thử lại
        </button>
      </div>
    </main>
  );
}

function CartEmpty() {
  return (
    <main className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <CartBreadcrumb />
      <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 md:p-10 text-center shadow-sm">
        <div className="mx-auto size-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <ShoppingCart className="size-7 text-slate-500" />
        </div>
        <h1 className="mt-5 text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
          Giỏ hàng của bạn đang trống
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Hãy thêm sản phẩm yêu thích để tiếp tục mua sắm.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-11 px-5 rounded-lg bg-primary text-white font-semibold items-center justify-center hover:bg-orange-600 transition-colors"
        >
          Quay lại mua sắm
        </Link>
      </div>
    </main>
  );
}

export default function CartPage() {
  const { data: cart, isLoading, isError, refetch } = useCart();
  const updateMutation = useUpdateCartItem();
  const removeMutation = useRemoveCartItem();
  const vnpayMutation = useCreateVnpayPaymentUrl();
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

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

  if (isLoading) return <CartLoading />;
  if (isError || !cart) return <CartError onRetry={() => refetch()} />;
  if (cart.items.length === 0) return <CartEmpty />;

  const handleCheckout = () => {
    const amount = effectiveTotal;

    if (amount <= 0) {
      toast.error("Số tiền thanh toán không hợp lệ");
      return;
    }

    const orderInfo = hasSelection
      ? `Order_Selected_${selectedCount}_${Date.now()}`
      : `Order_All_${Date.now()}`;

    vnpayMutation.mutate(
      {
        amount,
        locale: "vn",
        orderType: "fashion",
        orderInfo,
      },
      {
        onSuccess: (result) => {
          window.location.href = result.paymentUrl;
        },
      },
    );
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
      const failed = results.filter((item) => item.status === "rejected").length;
      if (failed === 0) {
        toast.success("Đã xóa các sản phẩm đã chọn");
      } else {
        toast.error(`Có ${failed} sản phẩm chưa thể xóa. Vui lòng thử lại.`);
      }
      setSelectedItemIds([]);
    });
  };

  const isAllSelected = cart.items.length > 0 && selectedCount === cart.items.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedItemIds([]);
      return;
    }

    setSelectedItemIds(cart.items.map((item) => item.itemId));
  };

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950 pb-28">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-3xl font-black tracking-tight text-primary"
            >
              AURA
            </Link>
            <span className="text-slate-300">|</span>
            <h1 className="text-2xl font-semibold text-slate-700 dark:text-slate-200">
              Giỏ hàng
            </h1>
          </div>

          <div className="hidden w-full max-w-xl md:flex items-center rounded-sm border border-primary bg-white dark:bg-slate-900">
            <input
              placeholder="Freeship 0đ (*)"
              className="h-11 flex-1 bg-transparent px-4 text-sm text-slate-700 outline-none dark:text-slate-100"
            />
            <button className="flex h-11 w-14 items-center justify-center bg-primary text-white">
              <Search className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4">
          <CartBreadcrumb />
        </div>

        <div className="mb-3 hidden lg:grid grid-cols-[1.7fr_0.6fr_0.6fr_0.7fr_0.5fr] rounded-sm bg-white px-4 py-4 text-base text-slate-600 shadow-sm dark:bg-slate-900 dark:text-slate-300">
          <span>Sản phẩm</span>
          <span className="text-center">Đơn giá</span>
          <span className="text-center">Số lượng</span>
          <span className="text-center">Số tiền</span>
          <span className="text-center">Thao tác</span>
        </div>

        <section className="overflow-hidden rounded-sm border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Sản phẩm trong giỏ ({cart.totalItems})
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleSelectAll}
                className="text-xs font-bold uppercase tracking-wide text-slate-600 hover:text-primary transition-colors"
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

          <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-700">
            <button className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
              <Ticket className="size-4" />
              Thêm Shop Voucher
            </button>
          </div>

          <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
            Giảm 500.000đ phí vận chuyển đơn tối thiểu 0đ
            <button className="ml-2 text-primary hover:underline">Tìm hiểu thêm</button>
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 inset-x-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <button
            onClick={handleToggleSelectAll}
            className="text-sm text-slate-700 hover:text-primary dark:text-slate-200"
          >
            {isAllSelected ? "Bỏ chọn tất cả" : `Chọn tất cả (${cart.totalItems})`}
          </button>
          <button
            onClick={handleDeleteSelected}
            disabled={selectedItemIds.length === 0 || removeMutation.isPending}
            className="text-sm text-slate-700 hover:text-red-600 disabled:opacity-40 dark:text-slate-200"
          >
            Xóa
          </button>
          <button className="text-sm text-primary hover:underline">Lưu vào mục Đã thích</button>

          <div className="ml-auto text-right">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Tổng cộng ({hasSelection ? selectedCount : cart.totalItems} sản phẩm):
              <span className="ml-1 text-2xl font-bold text-primary">
                {formatPrice(effectiveTotal)}
              </span>
            </p>
          </div>
          <button
            onClick={handleCheckout}
            disabled={
              vnpayMutation.isPending ||
              updateMutation.isPending ||
              removeMutation.isPending
            }
            className="h-11 min-w-40 rounded-sm bg-primary px-6 text-white font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {vnpayMutation.isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Đang xử lý
              </span>
            ) : (
              "Mua hàng"
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
