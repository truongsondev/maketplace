import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse, ApiErrorResponse } from "@/types/api.types";
import type { CategoryStat, ProductListResponse } from "@/types/product";

export const productService = {
  async getCategoryStats(): Promise<CategoryStat[]> {
    const response = await apiClient.get<CategoryStat[]>(
      "api/products/categories/stats",
    );

    if (response.success) {
      return (response as ApiSuccessResponse<CategoryStat[]>).data;
    }

    throw response as ApiErrorResponse;
  },

  async getProducts(): Promise<ProductListResponse> {
    const response = await apiClient.get<ProductListResponse>("api/products/");

    if (response.success) {
      return (response as ApiSuccessResponse<ProductListResponse>).data;
    }

    throw response as ApiErrorResponse;
  },
};
