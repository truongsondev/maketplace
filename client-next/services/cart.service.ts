import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse, ApiErrorResponse } from "@/types/api.types";

export interface AddToCartRequest {
  variantId: string;
  quantity: number;
}

export interface CartItem {
  itemId: string;
  productId: string;
  productName: string;
  variantId: string;
  variantSku: string;
  variantAttributes: Record<string, string>;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  image?: {
    url: string;
    altText: string;
  };
}

export interface CartData {
  cartId: string;
  totalItems: number;
  totalQuantity: number;
  totalAmount: number;
  items: CartItem[];
}

export interface CartSummaryData {
  totalItems: number;
  totalPrice: number;
}

export interface UpdateCartItemRequest {
  itemId: string;
  quantity: number;
}

export interface RemoveCartItemRequest {
  itemId: string;
}

export const cartService = {
  async getCartSummary(): Promise<CartSummaryData> {
    const response = await apiClient.get<CartSummaryData>("api/cart/summary");

    if (response.success) {
      return (response as ApiSuccessResponse<CartSummaryData>).data;
    }

    throw response as ApiErrorResponse;
  },

  async getCart(): Promise<CartData> {
    const response = await apiClient.get<CartData>("api/cart");

    if (response.success) {
      return (response as ApiSuccessResponse<CartData>).data;
    }

    throw response as ApiErrorResponse;
  },

  async addToCart(payload: AddToCartRequest): Promise<CartData> {
    const response = await apiClient.post<CartData>("api/cart/items", payload);

    if (response.success) {
      return (response as ApiSuccessResponse<CartData>).data;
    }

    throw response as ApiErrorResponse;
  },

  async updateCartItem(payload: UpdateCartItemRequest): Promise<CartData> {
    const response = await apiClient.patch<CartData>(
      `api/cart/items/${payload.itemId}`,
      {
        quantity: payload.quantity,
      },
    );

    if (response.success) {
      return (response as ApiSuccessResponse<CartData>).data;
    }

    throw response as ApiErrorResponse;
  },

  async removeCartItem(payload: RemoveCartItemRequest): Promise<CartData> {
    const response = await apiClient.delete<CartData>(
      `api/cart/items/${payload.itemId}`,
    );

    if (response.success) {
      return (response as ApiSuccessResponse<CartData>).data;
    }

    throw response as ApiErrorResponse;
  },
};
