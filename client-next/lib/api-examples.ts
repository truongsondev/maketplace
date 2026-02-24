/**
 * Example: How to use the standardized API client
 *
 * All API responses follow this format:
 * - Success: { success: true, data: {...}, message?: string, timestamp: string }
 * - Error: { success: false, error: { code, message, details, timestamp } }
 */

import { apiClient } from "@/lib/api-client";
import {
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiPaginatedResponse,
} from "@/types/api.types";

// ============================================
// Example 1: Simple GET request
// ============================================
export async function getUserProfile() {
  try {
    const response = await apiClient.get<{
      id: string;
      name: string;
      email: string;
    }>("/api/users/profile");

    if (response.success) {
      console.log("User data:", response.data);
      return response.data;
    }
  } catch (error) {
    const apiError = error as ApiErrorResponse;
    console.error("Error code:", apiError.error.code);
    console.error("Error message:", apiError.error.message);
    console.error("Error details:", apiError.error.details);
  }
}

// ============================================
// Example 2: POST request with authentication
// ============================================
export async function sendOTP(email: string) {
  try {
    const response = await apiClient.post<{ otpId: string }>(
      "/api/auth/register/send-otp",
      { email },
    );

    if (response.success) {
      console.log("OTP sent, ID:", response.data.otpId);
      return response.data;
    }
  } catch (error) {
    const apiError = error as ApiErrorResponse;
    console.error("Failed to send OTP:", apiError.error.message);
  }
}

// ============================================
// Example 3: Paginated response
// ============================================
export async function getProducts(page: number = 1, limit: number = 10) {
  try {
    const response = await apiClient.get<any[]>(
      `/api/products?page=${page}&limit=${limit}`,
    );

    if (response.success && "pagination" in response) {
      const paginatedResponse = response as ApiPaginatedResponse;
      console.log("Total products:", paginatedResponse.pagination.total);
      console.log("Current page:", paginatedResponse.pagination.page);
      return paginatedResponse;
    }
  } catch (error) {
    const apiError = error as ApiErrorResponse;
    console.error("Failed to fetch products:", apiError.error.message);
  }
}

// ============================================
// Example 4: Type-safe success/error handling
// ============================================
export async function loginUser(email: string, password: string) {
  try {
    const response = await apiClient.post<{
      accessToken: string;
      user: { id: string; name: string; role: string };
    }>("/api/auth/login", { email, password });

    // Type guard for success response
    if (response.success && "data" in response) {
      const successResponse = response as ApiSuccessResponse;
      apiClient.setAuthToken(successResponse.data.accessToken);
      return successResponse.data.user;
    }
  } catch (error) {
    const apiError = error as ApiErrorResponse;
    console.error("Login failed:", apiError.error);
    throw apiError;
  }
}

// ============================================
// Example 5: Handle both success and error
// ============================================
export async function updateProfile(data: any) {
  const response = await apiClient.put<{
    id: string;
    name: string;
    email: string;
  }>("/api/users/profile", data);

  if (response.success) {
    console.log("Profile updated:", response.data);
    return { success: true, data: response.data };
  } else {
    console.error("Update failed:", response.error);
    return { success: false, error: response.error };
  }
}
