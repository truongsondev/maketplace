import { apiClient } from "@/lib/api-client";
import { getSessionId } from "@/lib/session-id";
import type { TrackingPayload } from "@/types/recommendation.types";

export const trackingService = {
  async track(payload: TrackingPayload): Promise<void> {
    try {
      await apiClient.post(
        "api/track",
        {
          ...payload,
          occurredAt: payload.occurredAt ?? new Date().toISOString(),
        },
        {
          headers: {
            "x-session-id": getSessionId(),
          },
        },
      );
    } catch {
      // Fire-and-forget tracking should never block UX.
    }
  },
};

