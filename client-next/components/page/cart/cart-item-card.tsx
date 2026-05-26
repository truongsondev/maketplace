import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Loader2, Circle, CheckCircle2 } from "lucide-react";
import type { CartItem } from "@/services/cart.service";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=600&fit=crop";

interface CartItemCardProps {
  item: CartItem;
  selected: boolean;
  isUpdating: boolean;
  isRemoving: boolean;
  onToggleSelect: (item: CartItem) => void;
  onDecrease: (item: CartItem) => void;
  onIncrease: (item: CartItem) => void;
  onRemove: (item: CartItem) => void;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

export function CartItemCard({
  item,
  selected,
  isUpdating,
  isRemoving,
  onToggleSelect,
  onDecrease,
  onIncrease,
  onRemove,
}: CartItemCardProps) {
  const canDecrease = item.quantity > 1 && !isUpdating && !isRemoving;
  const canIncrease =
    item.quantity < item.maxAllowedQuantity && !isUpdating && !isRemoving;
  const reachedStockLimit =
    item.maxAllowedQuantity > 0 && item.quantity >= item.maxAllowedQuantity;

  return (
    <article
      className={`border-b border-black/10 px-4 py-5 transition-colors dark:border-white/10 ${
        selected
          ? "bg-white/62 dark:bg-white/8"
          : "bg-transparent hover:bg-white/36 dark:hover:bg-white/5"
      }`}
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.8fr_0.55fr_0.65fr_0.7fr_0.55fr] lg:items-center">
        <button
          onClick={() => onToggleSelect(item)}
          className="hidden"
          aria-label={selected ? "Bỏ chọn sản phẩm" : "Chọn sản phẩm"}
        >
          {selected ? (
            <CheckCircle2 className="size-4 text-primary" />
          ) : (
            <Circle className="size-4" />
          )}
        </button>

        <div className="min-w-0 flex gap-3">
          <button
            onClick={() => onToggleSelect(item)}
            className="mt-1 flex size-6 shrink-0 items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
            aria-label={selected ? "Bỏ chọn sản phẩm" : "Chọn sản phẩm"}
          >
            {selected ? (
              <CheckCircle2 className="size-4 text-black dark:text-white" />
            ) : (
              <Circle className="size-4" />
            )}
          </button>

          <Link
            href={`/product/${item.productId}`}
            className="relative h-32 w-24 shrink-0 overflow-hidden bg-neutral-100 dark:bg-neutral-800"
          >
            <Image
              src={item.image?.url || FALLBACK_IMAGE}
              alt={item.image?.altText || item.productName}
              fill
              sizes="96px"
              className="object-cover transition-transform duration-700 hover:scale-105"
            />
          </Link>

          <div className="min-w-0 py-1">
            <Link
              href={`/product/${item.productId}`}
              className="line-clamp-2 text-base font-medium uppercase tracking-[-0.01em] text-neutral-900 transition-opacity hover:opacity-65 dark:text-white"
            >
              {item.productName}
            </Link>

            <p className="mt-1 text-sm font-semibold text-neutral-900 dark:text-white lg:hidden">
              {formatPrice(item.subtotal)}
            </p>

            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-300">
              {Object.entries(item.variantAttributes).map(([key, value]) => (
                <span key={key}>
                  {key}: <strong className="font-semibold">{value}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>

        <p className="hidden lg:block text-sm text-neutral-900 dark:text-white lg:text-base lg:text-center">
          {formatPrice(item.unitPrice)}
        </p>

        <div className="flex items-center gap-2 lg:justify-center">
          <button
            onClick={() => onDecrease(item)}
            disabled={!canDecrease}
            className="flex size-9 items-center justify-center border border-black/15 text-neutral-700 transition-colors hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:text-neutral-100 dark:hover:border-white dark:hover:text-white"
            aria-label="Giảm số lượng"
          >
            <Minus className="size-3.5" />
          </button>

          <div className="flex h-9 w-11 items-center justify-center border-y border-black/15 text-sm font-semibold text-neutral-900 dark:border-white/15 dark:text-white">
            {item.quantity}
          </div>

          <button
            onClick={() => onIncrease(item)}
            disabled={!canIncrease}
            className="flex size-9 items-center justify-center border border-black/15 text-neutral-700 transition-colors hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:text-neutral-100 dark:hover:border-white dark:hover:text-white"
            aria-label="Tăng số lượng"
          >
            <Plus className="size-3.5" />
          </button>
        </div>

        <p className="hidden lg:block text-sm font-semibold text-neutral-900 dark:text-white lg:text-base lg:text-center">
          {formatPrice(item.subtotal)}
        </p>

        <div className="flex items-center gap-2 lg:flex-col lg:items-center">
          <button
            onClick={() => onRemove(item)}
            disabled={isRemoving || isUpdating}
            className="luxury-muted-action disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Gỡ khỏi giỏ hàng"
          >
            {isRemoving ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="size-3.5 animate-spin" />
                Đang cập nhật
              </span>
            ) : (
              "Gỡ khỏi giỏ hàng"
            )}
          </button>

          <Link href="/#products" className="luxury-muted-action">
            Khám phá mood tương tự
          </Link>
        </div>
      </div>
    </article>
  );
}
