"use client";

import { useEffect, useRef } from "react";
import { trackingService } from "@/services/tracking.service";

type UseProductDwellTrackingOptions = {
  productId: string;
  productName?: string;
  source: string;
  placement: string;
  thresholdMs?: number;
  metadata?: Record<string, unknown>;
};

export function useProductDwellTracking({
  productId,
  productName,
  source,
  placement,
  thresholdMs = 5000,
  metadata,
}: UseProductDwellTrackingOptions) {
  const trackedRef = useRef(false);
  const accumulatedMsRef = useRef(0);
  const activeStartedAtRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    trackedRef.current = false;
    accumulatedMsRef.current = 0;
    activeStartedAtRef.current = null;

    const clearPendingTimeout = () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const pauseTracking = () => {
      if (activeStartedAtRef.current !== null) {
        accumulatedMsRef.current += Date.now() - activeStartedAtRef.current;
        activeStartedAtRef.current = null;
      }
      clearPendingTimeout();
    };

    const fireTrackedEvent = () => {
      if (trackedRef.current) return;

      trackedRef.current = true;
      clearPendingTimeout();

      void trackingService.track({
        eventType: "VIEW_PRODUCT",
        productId,
        source,
        placement,
        metadata: {
          productName,
          dwellMs: thresholdMs,
          dwellSeconds: Math.round(thresholdMs / 1000),
          ...metadata,
        },
      });
    };

    const resumeTracking = () => {
      if (trackedRef.current || typeof document === "undefined") return;
      if (document.visibilityState !== "visible") return;
      if (activeStartedAtRef.current !== null) return;

      activeStartedAtRef.current = Date.now();
      const remainingMs = Math.max(0, thresholdMs - accumulatedMsRef.current);

      if (remainingMs === 0) {
        fireTrackedEvent();
        return;
      }

      clearPendingTimeout();
      timeoutRef.current = window.setTimeout(() => {
        accumulatedMsRef.current = thresholdMs;
        activeStartedAtRef.current = null;
        fireTrackedEvent();
      }, remainingMs);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        resumeTracking();
        return;
      }

      pauseTracking();
    };

    resumeTracking();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", pauseTracking);
    window.addEventListener("blur", pauseTracking);
    window.addEventListener("focus", resumeTracking);

    return () => {
      pauseTracking();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", pauseTracking);
      window.removeEventListener("blur", pauseTracking);
      window.removeEventListener("focus", resumeTracking);
    };
  }, [metadata, placement, productId, productName, source, thresholdMs]);
}
