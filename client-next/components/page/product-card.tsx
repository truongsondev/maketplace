"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart, ShoppingCart, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { ProductItem } from "@/types/product";
import {
  useFavoriteIds,
  useToggleFavorite,
} from "@/hooks/use-product-favorites";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=80";

function normalizeProductImageUrl(rawUrl: string | null) {
  if (!rawUrl) {
    return FALLBACK_IMAGE;
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return FALLBACK_IMAGE;
  }

  const absoluteUrl = trimmed.startsWith("//") ? `https:${trimmed}` : trimmed;

  if (absoluteUrl.includes("res.cloudinary.com") && absoluteUrl.includes("/upload/")) {
    return absoluteUrl.replace(
      "/upload/",
      "/upload/f_auto,q_auto,c_fill,w_900,h_1200/",
    );
  }

  if (absoluteUrl.includes("images.unsplash.com") && !absoluteUrl.includes("w=")) {
    return `${absoluteUrl}${absoluteUrl.includes("?") ? "&" : "?"}auto=format&fit=crop&w=900&q=80`;
  }

  return absoluteUrl;
}

interface ProductCardProps {
  product: ProductItem;
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { favoriteIds } = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();
  const normalizedImageUrl = useMemo(
    () => normalizeProductImageUrl(product.imageUrl),
    [product.imageUrl],
  );
  const [imageSrc, setImageSrc] = useState(normalizedImageUrl);

  const isFavorite = favoriteIds.has(product.id);
  const isTogglingFavorite =
    toggleFavorite.isPending &&
    toggleFavorite.variables?.productId === product.id;

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

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isTogglingFavorite) {
      return;
    }

    toggleFavorite.mutate({
      productId: product.id,
      isFavorite,
    });
  };

  useEffect(() => {
    setImageSrc(normalizedImageUrl);
  }, [normalizedImageUrl]);

  return (
    <div className="group relative flex flex-col">
      <div className="aspect-3/4 w-full overflow-hidden rounded-xl bg-neutral-200 dark:bg-neutral-800 relative">
        <button
          aria-label={isFavorite ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}
          onClick={handleToggleFavorite}
          disabled={isTogglingFavorite}
          className="absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-full bg-white text-neutral-400 opacity-0 shadow-sm transition-all hover:text-red-500 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-100"
        >
          <Heart
            className={`size-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`}
          />
        </button>
        <img
          src={imageSrc}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
          onClick={handleViewDetail}
          onError={() => setImageSrc(FALLBACK_IMAGE)}
        />

        {/* Action Buttons */}
        <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleAddToCart}
            aria-label="Thêm sản phẩm vào giỏ hàng"
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white text-sm font-bold px-4 py-2.5 rounded-lg shadow-lg hover:bg-orange-600 transition-colors"
          >
            <ShoppingCart className="size-4" />
            Thêm
          </button>
          <button
            onClick={handleViewDetail}
            aria-label="Xem chi tiết sản phẩm"
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
