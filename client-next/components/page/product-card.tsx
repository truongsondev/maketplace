"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Eye, Heart, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ProductItem } from "@/types/product";
import { useProductCardDwellTracking } from "@/hooks/use-product-card-dwell-tracking";
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

  if (
    absoluteUrl.includes("res.cloudinary.com") &&
    absoluteUrl.includes("/upload/")
  ) {
    return absoluteUrl.replace(
      "/upload/",
      "/upload/f_auto,q_auto,c_fill,w_900,h_1200/",
    );
  }

  if (
    absoluteUrl.includes("images.unsplash.com") &&
    !absoluteUrl.includes("w=")
  ) {
    return `${absoluteUrl}${absoluteUrl.includes("?") ? "&" : "?"}auto=format&fit=crop&w=900&q=80`;
  }

  return absoluteUrl;
}

interface ProductCardProps {
  product: ProductItem;
  trackingPlacement?: string;
  trackingSource?: string;
  enableDwellTracking?: boolean;
  dwellThresholdMs?: number;
}

export function ProductCard({
  product,
  trackingPlacement = "product_grid",
  trackingSource = "product_card_dwell",
  enableDwellTracking = true,
  dwellThresholdMs = 5000,
}: ProductCardProps) {
  const router = useRouter();
  const { favoriteIds } = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();
  const normalizedImageUrl = useMemo(
    () => normalizeProductImageUrl(product.imageUrl),
    [product.imageUrl],
  );
  const [imageSrc, setImageSrc] = useState(normalizedImageUrl);
  const cardRef = useProductCardDwellTracking({
    productId: product.id,
    productName: product.name,
    placement: trackingPlacement,
    source: trackingSource,
    thresholdMs: dwellThresholdMs,
    enabled: enableDwellTracking,
  });

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
    handleViewDetail();
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
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "80px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col"
    >
      <div className="relative aspect-3/4 w-full overflow-hidden bg-[#ebe7df] dark:bg-neutral-900">
        <button
          aria-label={isFavorite ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}
          onClick={handleToggleFavorite}
          disabled={isTogglingFavorite}
          className="absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-full border border-white/70 bg-white/82 text-neutral-500 opacity-0 shadow-[0_12px_35px_rgba(0,0,0,0.12)] backdrop-blur-md transition-all duration-300 hover:scale-105 hover:text-black group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-100"
        >
          <Heart
            className={`size-4 ${isFavorite ? "fill-black text-black dark:fill-white dark:text-white" : ""}`}
          />
        </button>
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 72vw, (max-width: 1024px) 44vw, 25vw"
          loading="lazy"
          className="h-full w-full cursor-pointer object-cover transition-transform duration-700 ease-out group-hover:scale-[1.045]"
          onClick={handleViewDetail}
          onError={() => setImageSrc(FALLBACK_IMAGE)}
        />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/28 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        <div className="absolute inset-x-3 bottom-3 flex translate-y-3 gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <button
            onClick={handleAddToCart}
            aria-label="Thêm sản phẩm vào giỏ hàng"
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-white px-4 text-xs font-semibold uppercase tracking-[0.16em] text-black shadow-[0_14px_36px_rgba(0,0,0,0.18)] transition-colors hover:bg-[#d8c39d]"
          >
            <ShoppingBag className="size-4" />
            Chọn
          </button>
          <button
            onClick={handleViewDetail}
            aria-label="Xem chi tiết sản phẩm"
            className="flex size-11 items-center justify-center rounded-full border border-white/35 bg-black/55 text-white shadow-[0_14px_36px_rgba(0,0,0,0.16)] backdrop-blur-md transition-colors hover:bg-black"
          >
            <Eye className="size-4" />
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-1.5">
        <h3 className="text-[13px] font-medium uppercase leading-5 tracking-[0.08em] text-neutral-700 dark:text-neutral-300">
          <button
            onClick={handleViewDetail}
            className="line-clamp-2 text-left transition-colors hover:text-black dark:hover:text-white"
            title={product.name}
          >
            {product.name}
          </button>
        </h3>
        <p className="text-sm font-semibold tracking-[0.04em] text-neutral-950 dark:text-white">
          {formattedPrice}
        </p>
      </div>
    </motion.div>
  );
}
