import { apiClient } from "@/lib/api-client";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api.types";

export interface BannerSummary {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  imageUrl: string;
  sortOrder: number;
}

export const bannerService = {
  async getActiveBanners(): Promise<BannerSummary[]> {
    const response = await apiClient.get<{ items: BannerSummary[] }>(
      "api/common/banners/active",
    );

    if (response.success) {
      return (response as ApiSuccessResponse<{ items: BannerSummary[] }>).data
        .items;
    }

    throw response as ApiErrorResponse;
  },
};
