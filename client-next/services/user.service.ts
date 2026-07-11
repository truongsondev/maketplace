import { apiClient } from "@/lib/api-client";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api.types";

export interface MyAccount {
  id: string;
  email: string | null;
  status: string | null;
}

export const userService = {
  async getMe(): Promise<MyAccount> {
    const response = await apiClient.get<MyAccount>("api/users/me");

    if (response.success) {
      return (response as ApiSuccessResponse<MyAccount>).data;
    }

    throw response as ApiErrorResponse;
  },
};
