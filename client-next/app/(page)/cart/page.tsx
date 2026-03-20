"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Loader2, ShoppingCart, Trash2 } from "lucide-react";
import { CartItemCard, CartSummary } from "@/components/page/cart";
import {
  useCart,
  useRemoveCartItem,
  useUpdateCartItem,
} from "@/hooks/use-cart";
import type { CartItem } from "@/services/cart.service";

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

function CartLoading() {
  return (
    <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  const updatingItemId = updateMutation.isPending
    ? updateMutation.variables?.itemId
    : undefined;
  const removingItemId = removeMutation.isPending
    ? removeMutation.variables?.itemId
    : undefined;

  const mobileTotal = useMemo(() => {
    if (!cart) return 0;
    return cart.totalAmount;
  }, [cart]);

  const selectedCount = useMemo(
    () =>
      cart?.items.filter((item) => selectedItemIds.includes(item.itemId))
        .length ?? 0,
    [cart?.items, selectedItemIds],
  );

  if (isLoading) return <CartLoading />;
  if (isError || !cart) return <CartError onRetry={() => refetch()} />;
  if (cart.items.length === 0) return <CartEmpty />;

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
    if (selectedItemIds.length === 0) return;

    selectedItemIds.forEach((itemId) => {
      removeMutation.mutate({ itemId });
    });

    setSelectedItemIds([]);
  };

  return (
    <main className="w-full max-w-[1200px] mx-auto bg-slate-100/70 dark:bg-slate-900/40 lg:min-h-[80vh] lg:border-x border-slate-200 dark:border-slate-800 pb-28 lg:pb-0">
      <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr]">
        <section className="px-4 sm:px-6 lg:px-8 py-6 lg:py-7">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-extrabold tracking-tight uppercase text-slate-900 dark:text-white flex items-center gap-2">
              CARTS
              <span className="text-sm font-semibold text-slate-500">
                {String(cart.totalItems).padStart(2, "0")}
              </span>
            </h1>

            <button
              onClick={handleDeleteSelected}
              disabled={
                selectedItemIds.length === 0 || removeMutation.isPending
              }
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-red-500 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="size-3.5" />
              Delete all
            </button>
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

          <div className="mt-4 text-xs text-slate-500">
            Đã chọn: {selectedCount} / {cart.totalItems} sản phẩm
          </div>
        </section>

        <section className="border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40">
          <CartSummary cart={cart} />
        </section>
      </div>

      <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
        <div className="max-w-6xl mx-auto px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tổng tiền
            </p>
            <p className="text-base font-bold text-primary truncate">
              {formatPrice(mobileTotal)}
            </p>
          </div>
          <button className="ml-auto h-11 px-5 rounded-lg bg-primary text-white font-bold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2">
            {updateMutation.isPending || removeMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Đang cập nhật...
              </>
            ) : (
              "CHECKOUT"
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
