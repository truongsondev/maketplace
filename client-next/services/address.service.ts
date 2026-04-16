import { apiClient } from "@/lib/api-client";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api.types";
import type { UserAddress } from "@/types/address.types";

export const addressService = {
  async getMyAddresses(): Promise<UserAddress[]> {
    const response = await apiClient.get<UserAddress[]>("api/addresses");

    if (response.success) {
      return (response as ApiSuccessResponse<UserAddress[]>).data;
    }

    throw response as ApiErrorResponse;
  },

  async getLastUsedAddress(): Promise<UserAddress | null> {
    const response = await apiClient.get<UserAddress | null>(
      "api/addresses/last-used",
    );

    if (response.success) {
      return (response as ApiSuccessResponse<UserAddress | null>).data;
    }

    throw response as ApiErrorResponse;
  },
};
