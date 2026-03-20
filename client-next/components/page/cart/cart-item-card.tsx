import Image from "next/image";
import Link from "next/link";
import {
  Minus,
  Plus,
  Trash2,
  Loader2,
  Circle,
  CheckCircle2,
} from "lucide-react";
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
  const canIncrease = item.quantity < 10 && !isUpdating && !isRemoving;

  return (
    <article className="border-b border-dashed border-slate-200 dark:border-slate-700 py-4 first:pt-0 last:border-b-0">
      <div className="flex gap-3 md:gap-4 items-start">
        <button
          onClick={() => onToggleSelect(item)}
          className="mt-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          aria-label={selected ? "Bỏ chọn sản phẩm" : "Chọn sản phẩm"}
        >
          {selected ? (
            <CheckCircle2 className="size-4 text-primary" />
          ) : (
            <Circle className="size-4" />
          )}
        </button>

        <Link
          href={`/product/${item.productId}`}
          className="relative size-20 md:size-24 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0"
        >
          <Image
            src={item.image?.url || FALLBACK_IMAGE}
            alt={item.image?.altText || item.productName}
            fill
            sizes="(max-width: 768px) 80px, 96px"
            className="object-cover"
          />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                href={`/product/${item.productId}`}
                className="font-semibold text-slate-900 dark:text-white line-clamp-1 hover:text-primary transition-colors"
              >
                {item.productName}
              </Link>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
                {Object.entries(item.variantAttributes).map(([key, value]) => (
                  <span key={key}>
                    {key}: <strong>{value}</strong>
                  </span>
                ))}
              </div>
            </div>

            <p className="text-base font-semibold text-slate-900 dark:text-white whitespace-nowrap">
              {formatPrice(item.unitPrice)}
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onRemove(item)}
                disabled={isRemoving || isUpdating}
                className="size-7 rounded-full border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-600 hover:border-red-200 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Xóa sản phẩm"
              >
                {isRemoving ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
              </button>

              <button
                onClick={() => onDecrease(item)}
                disabled={!canDecrease}
                className="size-7 rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-100 hover:border-primary hover:text-primary transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Giảm số lượng"
              >
                <Minus className="size-3.5" />
              </button>

              <div className="w-8 text-center text-sm font-semibold text-slate-900 dark:text-white">
                {item.quantity}
              </div>

              <button
                onClick={() => onIncrease(item)}
                disabled={!canIncrease}
                className="size-7 rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-100 hover:border-primary hover:text-primary transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Tăng số lượng"
              >
                <Plus className="size-3.5" />
              </button>
            </div>

            <p className="text-sm font-semibold text-slate-900 dark:text-white whitespace-nowrap">
              {formatPrice(item.subtotal)}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
