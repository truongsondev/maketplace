import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse, ApiErrorResponse } from "@/types/api.types";
import type {
  CategoryStat,
  FavoriteProductsResponse,
  FavoriteToggleResponse,
  ProductListResponse,
  ProductDetail,
} from "@/types/product";

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

  async getProductDetail(id: string): Promise<ProductDetail> {
    const response = await apiClient.get<ProductDetail>(`api/products/${id}`);
    console.log("Product detail response:", response);
    if (response.success) {
      return (response as ApiSuccessResponse<ProductDetail>).data;
    }

    throw response as ApiErrorResponse;
  },

  async addToFavorites(productId: string): Promise<FavoriteToggleResponse> {
    const response = await apiClient.post<FavoriteToggleResponse>(
      `api/products/${productId}/favorite`,
    );

    if (response.success) {
      return (response as ApiSuccessResponse<FavoriteToggleResponse>).data;
    }

    throw response as ApiErrorResponse;
  },

  async removeFromFavorites(productId: string): Promise<FavoriteToggleResponse> {
    const response = await apiClient.delete<FavoriteToggleResponse>(
      `api/products/${productId}/favorite`,
    );

    if (response.success) {
      return (response as ApiSuccessResponse<FavoriteToggleResponse>).data;
    }

    throw response as ApiErrorResponse;
  },

  async getFavoriteProducts(
    page = 1,
    limit = 100,
  ): Promise<FavoriteProductsResponse> {
    const response = await apiClient.get<FavoriteProductsResponse>(
      `api/products/favorites?page=${page}&limit=${limit}`,
    );

    if (response.success) {
      return (response as ApiSuccessResponse<FavoriteProductsResponse>).data;
    }

    throw response as ApiErrorResponse;
  },
};
