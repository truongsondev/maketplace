import type { ProductItem } from "@/types/product";

export interface RecommendationItem extends ProductItem {
  score: number;
  reason: string;
  source: string;
}

export interface RecommendationFeed {
  title: string;
  strategy: string;
  generatedAt: string;
  items: RecommendationItem[];
}

export type TrackingEventType =
  | "VIEW_PRODUCT"
  | "ADD_TO_CART"
  | "REMOVE_FROM_CART"
  | "PURCHASE"
  | "SEARCH_QUERY"
  | "FAVORITE_PRODUCT";

export interface TrackingPayload {
  eventType: TrackingEventType;
  productId?: string;
  orderId?: string;
  searchQuery?: string;
  source?: string;
  placement?: string;
  occurredAt?: string;
  dedupeKey?: string;
  metadata?: Record<string, unknown>;
}

