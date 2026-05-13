"use client";

import { useEffect, useMemo, useRef } from "react";
import { Loader2 } from "lucide-react";
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
  productId?: string;
  limit?: number;
  enabled?: boolean;
  title?: string;
  placement: string;
  emptyMessage?: string;
};

export function RecommendationShelf({
  kind,
  productId,
  limit = 8,
  enabled = true,
  placement,
  emptyMessage = "Chưa có gợi ý phù hợp lúc này.",
}: RecommendationShelfProps) {
  const impressionKeyRef = useRef<string | null>(null);

  const homeQuery = useHomeRecommendations(limit, enabled && kind === "home");
  const productQuery = useProductRecommendations(
    productId ?? "",
    limit,
    enabled && kind === "product",
  );
  const cartQuery = useCartRecommendations(limit, enabled && kind === "cart");
  const personalizedQuery = usePersonalizedRecommendations(
    limit,
    enabled && kind === "personalized",
  );

  const query =
    kind === "home"
      ? homeQuery
      : kind === "product"
        ? productQuery
        : kind === "cart"
          ? cartQuery
          : personalizedQuery;

  const feed = query.data;
  const items = useMemo(() => feed?.items ?? [], [feed?.items]);

  useEffect(() => {
    if (items.length === 0) return;

    const impressionKey = `${placement}:${items.map((item) => item.id).join(",")}`;
    if (impressionKeyRef.current === impressionKey) return;
    impressionKeyRef.current = impressionKey;

    void trackingService.track({
      eventType: "VIEW_PRODUCT",
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
      eventType: "VIEW_PRODUCT",
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

  return (
    <section className="rounded-sm border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:p-5">
      <div className="flex items-end justify-between gap-3">
        {" "}
        Gợi ý cho bạn{" "}
      </div>

      <div className="mt-5">
        {query.isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: Math.min(limit, 4) }).map((_, index) => (
              <div
                key={index}
                className="aspect-[3/4] animate-pulse rounded-sm bg-neutral-100 dark:bg-neutral-800"
              />
            ))}
          </div>
        ) : query.isError ? (
          <div className="flex items-center gap-2 rounded-sm border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-black dark:text-neutral-300">
            <Loader2 className="size-4" />
            Không tải được gợi ý lúc này.
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-sm border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-black dark:text-neutral-300">
            {emptyMessage}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => handleRecommendationClick(item)}
              >
                <ProductCard
                  product={item}
                  enableDwellTracking={false}
                  trackingPlacement={placement}
                  trackingSource="recommendation_card"
                />
                <div className="mt-2 px-1"></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
