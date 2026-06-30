import { apiClient } from "@/lib/api-client";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api.types";
import type {
  BodyProfile,
  UpdateBodyProfilePayload,
} from "@/types/body-profile.types";

export const bodyProfileService = {
  async getMine(): Promise<BodyProfile> {
    const response = await apiClient.get<BodyProfile>(
      "api/users/me/body-profile",
    );

    if (response.success) {
      return (response as ApiSuccessResponse<BodyProfile>).data;
    }

    throw response as ApiErrorResponse;
  },

  async updateMine(payload: UpdateBodyProfilePayload): Promise<BodyProfile> {
    const response = await apiClient.put<BodyProfile>(
      "api/users/me/body-profile",
      payload,
    );

    if (response.success) {
      return (response as ApiSuccessResponse<BodyProfile>).data;
    }

    throw response as ApiErrorResponse;
  },
};
