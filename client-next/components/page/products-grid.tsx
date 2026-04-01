"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ProductItem } from "@/types/product";
import { ProductCard } from "./product-card";

interface ProductsGridProps {
  products: ProductItem[];
  title?: string;
  isLoading?: boolean;
  isError?: boolean;
  activeFilters?: string[];
  onRetry?: () => void;
  onClearFilters?: () => void;
}

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="aspect-3/4 w-full rounded-xl bg-neutral-200 dark:bg-neutral-800" />
      <div className="flex flex-col gap-2">
        <div className="h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-4 w-1/2 rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>
    </div>
  );
}

export function ProductsGrid({
  products,
  title = "Sản phẩm hiện tại",
  isLoading,
  isError,
  activeFilters = [],
  onRetry,
  onClearFilters,
}: ProductsGridProps) {
  return (
    <section className="px-4 pb-16 lg:px-10">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
          {title}
        </h2>
        <Link
          href="/#products"
          className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          Xem tất cả
          <ChevronRight className="size-4" />
        </Link>
      </div>

      {activeFilters.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {activeFilters.map((chip) => (
            <span
              key={chip}
              className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
            >
              {chip}
            </span>
          ))}
        </div>
      )}

      {isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-center dark:border-red-900 dark:bg-red-950/30">
          <p className="text-sm font-semibold text-red-600 dark:text-red-300">
            Không thể tải danh sách sản phẩm.
          </p>
          <button
            onClick={onRetry}
            className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            Thử lại
          </button>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-8 text-center dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
            Không có sản phẩm phù hợp với bộ lọc hiện tại.
          </p>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Hãy thử từ khóa khác hoặc xóa bộ lọc để xem thêm sản phẩm.
          </p>
          {onClearFilters && (
            <button
              onClick={onClearFilters}
              className="mt-4 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
