"use client";

import { ChevronRight } from "lucide-react";
import { ProductItem } from "@/types/product";
import { ProductCard } from "./product-card";

interface ProductsGridProps {
  products: ProductItem[];
  title?: string;
  isLoading?: boolean;
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
}: ProductsGridProps) {
  return (
    <section className="px-4 pb-16 lg:px-10">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
          {title}
        </h2>
        <a
          href="#"
          className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          Xem tất cả
          <ChevronRight className="size-4" />
        </a>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
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
