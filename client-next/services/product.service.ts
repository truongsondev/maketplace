import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse, ApiErrorResponse } from "@/types/api.types";
import type {
  CategoryShowcase,
  CategoryStat,
  FavoriteProductsResponse,
  FavoriteToggleResponse,
  HomeTeamContentResponse,
  ProductListResponse,
  ProductDetail,
  ProductItem,
} from "@/types/product";

type ProductQueryParams = {
  page?: number;
  limit?: number;
  sort?: string;
  c?: string;
  s?: string;
  cl?: string;
  uo?: string;
  p?: string;
  q?: string;
};

type CategoryShowcaseParams = {
  categoryLimit?: number;
  productLimit?: number;
};

function buildQueryString(
  params: Record<string, string | number | boolean | undefined>,
) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const productService = {
  async getCategoryStats(nonEmptyOnly = false): Promise<CategoryStat[]> {
    const query = buildQueryString({ non_empty_only: nonEmptyOnly });
    const response = await apiClient.get<CategoryStat[]>(
      `api/products/categories/stats${query}`,
    );

    if (response.success) {
      return (response as ApiSuccessResponse<CategoryStat[]>).data;
    }

    throw response as ApiErrorResponse;
  },

  async getProducts(
    params: ProductQueryParams = {},
  ): Promise<ProductListResponse> {
    const query = buildQueryString(params);
    const response = await apiClient.get<ProductListResponse>(
      `api/common/products${query}`,
    );

    if (response.success) {
      return (response as ApiSuccessResponse<ProductListResponse>).data;
    }

    throw response as ApiErrorResponse;
  },

  async getCategoryShowcases(
    params: CategoryShowcaseParams = {},
  ): Promise<CategoryShowcase[]> {
    const query = buildQueryString({
      categoryLimit: params.categoryLimit,
      productLimit: params.productLimit,
    });
    const response = await apiClient.get<CategoryShowcase[]>(
      `api/products/category-showcases${query}`,
    );

    if (response.success) {
      return (response as ApiSuccessResponse<CategoryShowcase[]>).data;
    }

    throw response as ApiErrorResponse;
  },

  async getHomeTeamContent(): Promise<HomeTeamContentResponse> {
    const response = await apiClient.get<HomeTeamContentResponse>(
      "api/products/home/team-content",
    );

    if (response.success) {
      return (response as ApiSuccessResponse<HomeTeamContentResponse>).data;
    }

    throw response as ApiErrorResponse;
  },

  async getProductDetail(id: string): Promise<ProductDetail> {
    const response = await apiClient.get<ProductDetail>(`api/products/${id}`);

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

  async removeFromFavorites(
    productId: string,
  ): Promise<FavoriteToggleResponse> {
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

  async getRelatedFromMyOrders(
    limit = 12,
  ): Promise<{ products: ProductItem[] }> {
    const query = buildQueryString({ limit });
    const response = await apiClient.get<{ products: ProductItem[] }>(
      `api/products/related/my-orders${query}`,
    );

    if (response.success) {
      return (response as ApiSuccessResponse<{ products: ProductItem[] }>).data;
    }

    throw response as ApiErrorResponse;
  },
};
