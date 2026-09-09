import { apiClient } from "@/lib/api-client";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api.types";

export interface GhnProvince {
  id: number;
  name: string;
}

export type GhnDistrict = GhnProvince;

export interface GhnWard {
  code: string;
  name: string;
}

type GhnProvinceRaw = { ProvinceID: number; ProvinceName: string };
type GhnDistrictRaw = { DistrictID: number; DistrictName: string };
type GhnWardRaw = { WardCode: string | number; WardName: string };

export const locationService = {
  async getProvinces(): Promise<GhnProvince[]> {
    const response = await apiClient.get<GhnProvinceRaw[]>("api/shipping/ghn/provinces");
    if (response.success) {
      return (response as ApiSuccessResponse<GhnProvinceRaw[]>).data.map((item) => ({ id: item.ProvinceID, name: item.ProvinceName }));
    }
    throw response as ApiErrorResponse;
  },

  async getDistricts(provinceId: number): Promise<GhnDistrict[]> {
    const response = await apiClient.get<GhnDistrictRaw[]>(`api/shipping/ghn/districts?provinceId=${provinceId}`);
    if (response.success) {
      return (response as ApiSuccessResponse<GhnDistrictRaw[]>).data.map((item) => ({ id: item.DistrictID, name: item.DistrictName }));
    }
    throw response as ApiErrorResponse;
  },

  async getWards(districtId: number): Promise<GhnWard[]> {
    const response = await apiClient.get<GhnWardRaw[]>(`api/shipping/ghn/wards?districtId=${districtId}`);
    if (response.success) {
      return (response as ApiSuccessResponse<GhnWardRaw[]>).data.map((item) => ({ code: String(item.WardCode), name: item.WardName }));
    }
    throw response as ApiErrorResponse;
  },
};
