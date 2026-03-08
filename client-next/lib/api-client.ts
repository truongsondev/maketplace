import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosError,
} from "axios";
import type { ApiResponse, ApiErrorResponse } from "@/types/api.types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://160.187.229.142:8080";

class ApiClient {
  private readonly axios: AxiosInstance;

  constructor() {
    this.axios = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10_000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.axios.interceptors.request.use((config) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("access_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    });

    this.axios.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiErrorResponse>) => {
        const serverError = error.response?.data;
        if (serverError && serverError.success === false) {
          return Promise.reject(serverError);
        }
        // Network / timeout / unknown
        const fallback: ApiErrorResponse = {
          success: false,
          error: {
            code: "NETWORK_ERROR",
            message: error.message ?? "Network error occurred",
            timestamp: new Date().toISOString(),
          },
        };
        return Promise.reject(fallback);
      },
    );
  }

  async get<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const res = await this.axios.get<ApiResponse<T>>(url, config);
    return res.data;
  }

  async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const res = await this.axios.post<ApiResponse<T>>(url, data, config);
    return res.data;
  }

  async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const res = await this.axios.put<ApiResponse<T>>(url, data, config);
    return res.data;
  }

  async patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const res = await this.axios.patch<ApiResponse<T>>(url, data, config);
    return res.data;
  }

  async delete<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const res = await this.axios.delete<ApiResponse<T>>(url, config);
    return res.data;
  }

  setAuthToken(token: string) {
    this.axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", token);
    }
  }

  clearAuthToken() {
    delete this.axios.defaults.headers.common["Authorization"];
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
    }
  }
}

export const apiClient = new ApiClient();
