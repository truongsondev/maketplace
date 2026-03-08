"use client";

import { Heart, ShoppingCart, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { ProductItem } from "@/types/product";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=600&fit=crop";

interface ProductCardProps {
  product: ProductItem;
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();

  const formattedPrice = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(product.minPrice));

  const handleViewDetail = () => {
    router.push(`/product/${product.id}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement add to cart functionality
    console.log("Add to cart:", product.id);
  };

  return (
    <div className="group relative flex flex-col">
      <div className="aspect-3/4 w-full overflow-hidden rounded-xl bg-neutral-200 dark:bg-neutral-800 relative">
        <button className="absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-full bg-white text-neutral-400 opacity-0 shadow-sm transition-all hover:text-red-500 group-hover:opacity-100">
          <Heart className="size-5" />
        </button>
        <img
          src={product.imageUrl ?? FALLBACK_IMAGE}
          alt={product.name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
          onClick={handleViewDetail}
        />

        {/* Action Buttons */}
        <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleAddToCart}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white text-sm font-bold px-4 py-2.5 rounded-lg shadow-lg hover:bg-orange-600 transition-colors"
          >
            <ShoppingCart className="size-4" />
            Thêm
          </button>
          <button
            onClick={handleViewDetail}
            className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm font-bold px-4 py-2.5 rounded-lg shadow-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            <Eye className="size-4" />
            Chi tiết
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-1">
        <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          <button
            onClick={handleViewDetail}
            className="hover:text-primary transition-colors text-left"
          >
            {product.name}
          </button>
        </h3>
        <p className="text-sm font-bold text-neutral-900 dark:text-white">
          {formattedPrice}
        </p>
      </div>
    </div>
  );
}
