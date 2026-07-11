"use client";

import { useEffect, useMemo, useRef } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { ProductCard } from "@/components/page/product-card";
import {
  useCartRecommendations,
  useHomeRecommendations,
  usePersonalizedRecommendations,
  useProductRecommendations,
} from "@/hooks/use-recommendations";
import { trackingService } from "@/services/tracking.service";
import type { RecommendationItem } from "@/types/recommendation.types";

type RecommendationShelfKind = "home" | "product" | "cart" | "personalized";

type RecommendationShelfProps = {
  kind: RecommendationShelfKind;
  fallbackKind?: RecommendationShelfKind;
  productId?: string;
  limit?: number;
  enabled?: boolean;
  title?: string;
  placement: string;
  emptyMessage?: string;
};

export function RecommendationShelf({
  kind,
  fallbackKind,
  productId,
  limit = 8,
  enabled = true,
  placement,
}: RecommendationShelfProps) {
  const impressionKeyRef = useRef<string | null>(null);

  const homeQuery = useHomeRecommendations(
    limit,
    enabled && (kind === "home" || fallbackKind === "home"),
  );
  const productQuery = useProductRecommendations(
    productId ?? "",
    limit,
    enabled && (kind === "product" || fallbackKind === "product"),
  );
  const cartQuery = useCartRecommendations(
    limit,
    enabled && (kind === "cart" || fallbackKind === "cart"),
  );
  const personalizedQuery = usePersonalizedRecommendations(
    limit,
    enabled && (kind === "personalized" || fallbackKind === "personalized"),
  );

  const getQuery = (targetKind?: RecommendationShelfKind) =>
    targetKind === "home"
      ? homeQuery
      : targetKind === "product"
        ? productQuery
        : targetKind === "cart"
          ? cartQuery
          : personalizedQuery;

  const primaryQuery = getQuery(kind);
  const fallbackQuery = fallbackKind ? getQuery(fallbackKind) : null;
  const primaryItems = primaryQuery.data?.items ?? [];
  const fallbackItems = fallbackQuery?.data?.items ?? [];
  const shouldUseFallback =
    primaryItems.length === 0 && fallbackItems.length > 0;
  const query = shouldUseFallback ? fallbackQuery! : primaryQuery;
  const feed = query.data;
  const items = useMemo(() => feed?.items ?? [], [feed?.items]);

  useEffect(() => {
    if (items.length === 0) return;

    const impressionKey = `${placement}:${items.map((item) => item.id).join(",")}`;
    if (impressionKeyRef.current === impressionKey) return;
    impressionKeyRef.current = impressionKey;

    void trackingService.track({
      eventType: "RECOMMENDATION_IMPRESSION",
      placement,
      source: "recommendation_impression",
      metadata: {
        recommendationIds: items.map((item) => item.id),
        strategy: feed?.strategy,
      },
    });
  }, [feed?.strategy, items, placement]);

  const handleRecommendationClick = (item: RecommendationItem) => {
    void trackingService.track({
      eventType: "RECOMMENDATION_CLICK",
      productId: item.id,
      placement,
      source: "recommendation_click",
      metadata: {
        reason: item.reason,
        strategy: feed?.strategy,
        score: item.score,
      },
    });
  };

  const isLoading = primaryQuery.isLoading || Boolean(fallbackQuery?.isLoading);
  const hasError = primaryQuery.isError && (fallbackQuery?.isError ?? true);

  if (!isLoading && !hasError && items.length === 0) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "120px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden border-y border-black/10 bg-[#f7f2e9] py-8 dark:border-white/10 dark:bg-neutral-950 sm:py-10"
    >
      <div className="mx-auto flex w-full max-w-330 items-end justify-between gap-5 px-4 md:px-6 lg:px-8">
        <div>
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-neutral-500 dark:text-neutral-400">
            <Sparkles className="size-3.5" />
            Curated for you
          </p>
          <h2 className="mt-3 text-3xl font-semibold uppercase tracking-[-0.02em] text-neutral-950 dark:text-white md:text-5xl">
            Gợi ý cho bạn
          </h2>
        </div>
      </div>

      <div className="mx-auto mt-8 w-full max-w-330 px-4 md:px-6 lg:px-8">
        {isLoading && items.length === 0 ? (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: Math.min(limit, 4) }).map((_, index) => (
              <div
                key={index}
                className="h-90 min-w-[72%] animate-pulse bg-white/70 dark:bg-neutral-900 sm:min-w-[44%] lg:min-w-[24%]"
              />
            ))}
          </div>
        ) : hasError ? (
          <div className="flex items-center gap-2 border border-black/10 bg-white/70 p-5 text-sm text-neutral-600 dark:border-white/10 dark:bg-black dark:text-neutral-300">
            <Loader2 className="size-4" />
            Không tải được gợi ý lúc này.
          </div>
        ) : (
          <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 [&::-webkit-scrollbar]:hidden">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                className="min-w-[72%] snap-start sm:min-w-[44%] lg:min-w-[24%]"
                onClick={() => handleRecommendationClick(item)}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: Math.min(index * 0.06, 0.24),
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <ProductCard
                  product={item}
                  enableDwellTracking={false}
                  trackingPlacement={placement}
                  trackingSource="recommendation_card"
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
}
