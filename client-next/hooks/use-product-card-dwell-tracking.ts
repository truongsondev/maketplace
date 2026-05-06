"use client";

import { useEffect, useRef } from "react";
import { trackingService } from "@/services/tracking.service";
import { getSessionId } from "@/lib/session-id";

type UseProductCardDwellTrackingOptions = {
  productId: string;
  productName?: string;
  placement: string;
  source: string;
  thresholdMs?: number;
  enabled?: boolean;
};

export function useProductCardDwellTracking({
  productId,
  productName,
  placement,
  source,
  thresholdMs = 5000,
  enabled = true,
}: UseProductCardDwellTrackingOptions) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const trackedRef = useRef(false);
  const visibleSinceRef = useRef<number | null>(null);
  const accumulatedVisibleMsRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);
  const isIntersectingRef = useRef(false);

  useEffect(() => {
    trackedRef.current = false;
    visibleSinceRef.current = null;
    accumulatedVisibleMsRef.current = 0;
    isIntersectingRef.current = false;

    if (!enabled || typeof window === "undefined") {
      return;
    }

    const sessionId = getSessionId();
    const storageKey = `recommendation:dwell:${sessionId}:${placement}:${productId}`;

    if (window.sessionStorage.getItem(storageKey) === "1") {
      trackedRef.current = true;
      return;
    }

    const clearPendingTimeout = () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const pauseVisibleTimer = () => {
      if (visibleSinceRef.current !== null) {
        accumulatedVisibleMsRef.current += Date.now() - visibleSinceRef.current;
        visibleSinceRef.current = null;
      }
      clearPendingTimeout();
    };

    const fireEvent = () => {
      if (trackedRef.current) return;

      trackedRef.current = true;
      clearPendingTimeout();
      window.sessionStorage.setItem(storageKey, "1");

      void trackingService.track({
        eventType: "VIEW_PRODUCT",
        productId,
        source,
        placement,
        metadata: {
          productName,
          dwellMs: thresholdMs,
          dwellSeconds: Math.round(thresholdMs / 1000),
          surface: "product_card",
        },
      });
    };

    const resumeVisibleTimer = () => {
      if (trackedRef.current) return;
      if (!isIntersectingRef.current) return;
      if (document.visibilityState !== "visible") return;
      if (visibleSinceRef.current !== null) return;

      visibleSinceRef.current = Date.now();
      const remainingMs = Math.max(0, thresholdMs - accumulatedVisibleMsRef.current);

      if (remainingMs === 0) {
        fireEvent();
        return;
      }

      clearPendingTimeout();
      timeoutRef.current = window.setTimeout(() => {
        accumulatedVisibleMsRef.current = thresholdMs;
        visibleSinceRef.current = null;
        fireEvent();
      }, remainingMs);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isIntersectingRef.current = Boolean(entry?.isIntersecting);

        if (isIntersectingRef.current) {
          resumeVisibleTimer();
          return;
        }

        pauseVisibleTimer();
      },
      {
        threshold: 0.6,
      },
    );

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        resumeVisibleTimer();
        return;
      }

      pauseVisibleTimer();
    };

    const node = elementRef.current;
    if (node) {
      observer.observe(node);
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", pauseVisibleTimer);
    window.addEventListener("blur", pauseVisibleTimer);
    window.addEventListener("focus", resumeVisibleTimer);

    return () => {
      observer.disconnect();
      pauseVisibleTimer();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", pauseVisibleTimer);
      window.removeEventListener("blur", pauseVisibleTimer);
      window.removeEventListener("focus", resumeVisibleTimer);
    };
  }, [enabled, placement, productId, productName, source, thresholdMs]);

  return elementRef;
}
