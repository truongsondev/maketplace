import { apiClient } from "@/lib/api-client";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api.types";

export interface LocationItem {
  code: number;
  name: string;
}

export const locationService = {
  async getProvinces(): Promise<LocationItem[]> {
    const response = await apiClient.get<{ items: LocationItem[] }>(
      "api/common/locations/provinces",
    );

    if (response.success) {
      return (response as ApiSuccessResponse<{ items: LocationItem[] }>).data
        .items;
    }

    throw response as ApiErrorResponse;
  },

  async getWardsByProvince(provinceCode: number): Promise<LocationItem[]> {
    const response = await apiClient.get<{ items: LocationItem[] }>(
      `api/common/locations/wards?provinceCode=${provinceCode}`,
    );

    if (response.success) {
      return (response as ApiSuccessResponse<{ items: LocationItem[] }>).data
        .items;
    }

    throw response as ApiErrorResponse;
  },
};
