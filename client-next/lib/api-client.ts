import axios, {
  AxiosInstance,
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import {
  ApiResponse,
  ApiErrorResponse,
  ApiSuccessResponse,
} from "@/types/api.types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * API Client with automatic response handling
 * Handles standardized ApiResponse format from server
 */
class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string = API_BASE_URL) {
    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    this.setupInterceptors();
  }

  /**
   * Setup axios interceptors for request and response handling
   */
  private setupInterceptors(): void {
    // Request interceptor - add auth token if available
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor - handle standardized responses
    this.axiosInstance.interceptors.response.use(
      (response) => response.data,
      (error: AxiosError) => {
        return this.handleError(error);
      },
    );
  }

  /**
   * Handle API errors uniformly
   */
  private handleError(error: AxiosError): Promise<ApiErrorResponse> {
    const response = error.response?.data as any;

    if (response && response.success === false) {
      // Server returned error in standard format
      return Promise.reject(response);
    }

    // Network or unexpected error - format as standard error
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: `HTTP_${error.response?.status || "ERROR"}`,
        message:
          response?.message || error.message || "An unexpected error occurred",
        details: {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
        },
        timestamp: new Date().toISOString(),
      },
    };

    return Promise.reject(errorResponse);
  }

  /**
   * GET request
   */
  async get<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    return this.axiosInstance.get(url, config);
  }

  /**
   * POST request
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    return this.axiosInstance.post(url, data, config);
  }

  /**
   * PUT request
   */
  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    return this.axiosInstance.put(url, data, config);
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    return this.axiosInstance.patch(url, data, config);
  }

  /**
   * DELETE request
   */
  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    return this.axiosInstance.delete(url, config);
  }

  /**
   * Get auth token from storage
   */
  private getAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("authToken");
  }

  /**
   * Set auth token
   */
  setAuthToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("authToken", token);
    }
  }

  /**
   * Clear auth token
   */
  clearAuthToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
    }
  }
}

export const apiClient = new ApiClient();
