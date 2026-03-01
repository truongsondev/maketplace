"use client";

import { Heart } from "lucide-react";
import { ProductItem } from "@/types/product";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=600&fit=crop";

interface ProductCardProps {
  product: ProductItem;
}

export function ProductCard({ product }: ProductCardProps) {
  const formattedPrice = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(product.minPrice));

  return (
    <div className="group relative flex flex-col">
      <div className="aspect-3/4 w-full overflow-hidden rounded-xl bg-neutral-200 dark:bg-neutral-800 relative">
        <button className="absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-full bg-white text-neutral-400 opacity-0 shadow-sm transition-all hover:text-red-500 group-hover:opacity-100">
          <Heart className="size-5" />
        </button>
        <img
          src={product.imageUrl ?? FALLBACK_IMAGE}
          alt={product.name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="mt-4 flex flex-col gap-1">
        <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          <a
            href={`/product/${product.id}`}
            className="hover:text-primary transition-colors"
          >
            {product.name}
          </a>
        </h3>
        <p className="text-sm font-bold text-neutral-900 dark:text-white">
          {formattedPrice}
        </p>
      </div>
    </div>
  );
}
