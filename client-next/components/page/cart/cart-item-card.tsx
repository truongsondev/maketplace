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
    <article
      className={`border-b border-slate-200 px-4 py-4 transition-colors dark:border-slate-700 ${
        selected ? "bg-orange-50/70 dark:bg-orange-950/20" : "bg-white dark:bg-slate-900"
      }`}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.7fr_0.6fr_0.6fr_0.7fr_0.5fr] lg:items-center">
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
            className="mt-1 flex size-6 shrink-0 items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
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
            className="relative size-20 rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0"
          >
            <Image
              src={item.image?.url || FALLBACK_IMAGE}
              alt={item.image?.altText || item.productName}
              fill
              sizes="80px"
              className="object-cover"
            />
          </Link>

          <div className="min-w-0">
            <Link
              href={`/product/${item.productId}`}
              className="font-medium text-slate-900 dark:text-white line-clamp-2 hover:text-primary transition-colors"
            >
              {item.productName}
            </Link>

            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-500 dark:text-slate-300">
              {Object.entries(item.variantAttributes).map(([key, value]) => (
                <span key={key}>
                  {key}: <strong>{value}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-900 dark:text-white lg:text-base lg:text-center">
          {formatPrice(item.unitPrice)}
        </p>

        <div className="flex items-center gap-2 lg:justify-center">
          <button
            onClick={() => onDecrease(item)}
            disabled={!canDecrease}
            className="size-8 rounded-sm border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-100 hover:border-primary hover:text-primary transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Giảm số lượng"
          >
            <Minus className="size-3.5" />
          </button>

          <div className="w-10 border border-slate-200 dark:border-slate-700 rounded-sm h-8 flex items-center justify-center text-sm font-semibold text-slate-900 dark:text-white">
            {item.quantity}
          </div>

          <button
            onClick={() => onIncrease(item)}
            disabled={!canIncrease}
            className="size-8 rounded-sm border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-100 hover:border-primary hover:text-primary transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Tăng số lượng"
          >
            <Plus className="size-3.5" />
          </button>
        </div>

        <p className="text-sm font-semibold text-primary lg:text-base lg:text-center">
          {formatPrice(item.subtotal)}
        </p>

        <div className="flex items-center gap-2 lg:flex-col lg:items-center">
          <button
            onClick={() => onRemove(item)}
            disabled={isRemoving || isUpdating}
            className="text-sm text-slate-600 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Xóa sản phẩm"
          >
            {isRemoving ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="size-3.5 animate-spin" />
                Đang xóa
              </span>
            ) : (
              "Xóa"
            )}
          </button>

          <Link
            href="/#products"
            className="text-xs text-primary hover:underline"
          >
            Tìm sản phẩm tương tự
          </Link>
        </div>
      </div>
    </article>
  );
}
