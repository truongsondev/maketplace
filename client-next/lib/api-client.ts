import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosError,
} from "axios";
import type { ApiResponse, ApiErrorResponse } from "@/types/api.types";
import type { RefreshTokenResponseData } from "@/types/auth.types";
import { resolveApiBaseUrl } from "@/lib/api-base-url";

const API_BASE_URL = resolveApiBaseUrl();
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const AUTH_SESSION_KEY = "auth-session";
const REFRESH_ENDPOINT = "api/auth/refresh-token";
const LOGIN_PATH = "/login";
const AUTH_PAGE_PATHS = new Set(["/login", "/register", "/verify-email"]);

const PROTECTED_PAGE_PREFIXES = [
  "/cart",
  "/checkout",
  "/orders",
  "/profile",
  "/favorites",
  "/payment",
];

type AuthEventHandlers = {
  onSessionUpdated?: (params: {
    token: { accessToken: string; refreshToken: string };
    user?: unknown;
    profile?: unknown;
  }) => void;
  onSessionCleared?: () => void;
};

interface RetryableAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
  skipAuthRefresh?: boolean;
}

class ApiClient {
  private readonly axios: AxiosInstance;
  private refreshPromise: Promise<string | null> | null = null;
  private authEventHandlers: AuthEventHandlers = {};

  constructor() {
    this.axios = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10_000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.axios.interceptors.request.use((config) => {
      const requestConfig = config as RetryableAxiosRequestConfig;

      if (
        typeof window !== "undefined" &&
        !requestConfig.skipAuthRefresh &&
        !this.isRefreshRequest(requestConfig.url)
      ) {
        const token = localStorage.getItem(ACCESS_TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    });

    this.axios.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiErrorResponse>) => {
        const originalRequest =
          (error.config as RetryableAxiosRequestConfig | undefined) ?? {};
        const statusCode = error.response?.status;

        const shouldRefreshToken =
          typeof window !== "undefined" &&
          statusCode === 401 &&
          !originalRequest._retry &&
          !originalRequest.skipAuthRefresh &&
          !this.isRefreshRequest(originalRequest.url);

        if (shouldRefreshToken) {
          originalRequest._retry = true;

          const newAccessToken = await this.refreshAccessToken();

          if (newAccessToken) {
            originalRequest.headers = {
              ...originalRequest.headers,
              Authorization: `Bearer ${newAccessToken}`,
            };

            return this.axios(originalRequest);
          }

          this.clearAuthToken({ notify: true });
          this.handleRefreshFailureRedirect();
        }

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

  private isRefreshRequest(url?: string): boolean {
    if (!url) return false;
    return url.includes(REFRESH_ENDPOINT);
  }

  private handleRefreshFailureRedirect() {
    if (typeof window === "undefined") return;

    const { pathname, search, hash } = window.location;
    if (AUTH_PAGE_PATHS.has(pathname)) return;

    const isProtectedPage = PROTECTED_PAGE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
    if (!isProtectedPage) return;

    const returnTo = `${pathname}${search}${hash}`;
    const params = new URLSearchParams({ redirect: returnTo });
    window.location.replace(`${LOGIN_PATH}?${params.toString()}`);
  }

  private getStoredRefreshToken(): string | null {
    if (typeof window === "undefined") return null;

    const directToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (directToken) return directToken;

    const authSessionRaw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!authSessionRaw) return null;

    try {
      const parsed = JSON.parse(authSessionRaw) as {
        state?: {
          token?: {
            refreshToken?: string | null;
          };
        };
      };

      return parsed.state?.token?.refreshToken ?? null;
    } catch {
      return null;
    }
  }

  private updatePersistedSessionTokens(
    accessToken: string,
    refreshToken: string,
  ) {
    if (typeof window === "undefined") return;

    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

    const authSessionRaw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!authSessionRaw) return;

    try {
      const parsed = JSON.parse(authSessionRaw) as {
        state?: {
          user?: unknown;
          profile?: unknown;
          token?: {
            accessToken?: string | null;
            refreshToken?: string | null;
          };
          isAuthenticated?: boolean;
        };
        version?: number;
      };

      if (!parsed.state) return;

      parsed.state.token = {
        ...parsed.state.token,
        accessToken,
        refreshToken,
      };
      parsed.state.isAuthenticated = true;

      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(parsed));
    } catch {
      // Ignore invalid persisted state and keep in-memory auth flow alive.
    }
  }

  private updatePersistedSessionAuthData(params: {
    accessToken: string;
    refreshToken: string;
    user?: unknown;
    profile?: unknown;
  }) {
    if (typeof window === "undefined") return;

    localStorage.setItem(ACCESS_TOKEN_KEY, params.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, params.refreshToken);

    const authSessionRaw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!authSessionRaw) return;

    try {
      const parsed = JSON.parse(authSessionRaw) as {
        state?: {
          user?: unknown;
          profile?: unknown;
          token?: {
            accessToken?: string | null;
            refreshToken?: string | null;
          };
          isAuthenticated?: boolean;
        };
        version?: number;
      };

      if (!parsed.state) return;

      parsed.state.token = {
        ...parsed.state.token,
        accessToken: params.accessToken,
        refreshToken: params.refreshToken,
      };
      parsed.state.isAuthenticated = true;

      if (typeof params.user !== "undefined") {
        parsed.state.user = params.user;
      }

      if (typeof params.profile !== "undefined") {
        parsed.state.profile = params.profile;
      }

      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(parsed));
    } catch {
      // Ignore invalid persisted state and keep in-memory auth flow alive.
    }
  }

  private clearPersistedSession() {
    if (typeof window === "undefined") return;

    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);

    const authSessionRaw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!authSessionRaw) return;

    try {
      const parsed = JSON.parse(authSessionRaw) as {
        state?: {
          user?: unknown;
          profile?: unknown;
          token?: {
            accessToken?: string | null;
            refreshToken?: string | null;
          };
          isAuthenticated?: boolean;
        };
        version?: number;
      };

      if (!parsed.state) return;

      parsed.state.token = {
        accessToken: null,
        refreshToken: null,
      };
      parsed.state.user = null;
      parsed.state.profile = null;
      parsed.state.isAuthenticated = false;

      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(parsed));
    } catch {
      // Ignore invalid persisted state and continue cleanup.
    }
  }

  private async performTokenRefresh(): Promise<string | null> {
    const refreshToken = this.getStoredRefreshToken();
    if (!refreshToken) return null;

    try {
      const refreshConfig: RetryableAxiosRequestConfig = {
        skipAuthRefresh: true,
      };

      const response = await this.axios.post<
        ApiResponse<RefreshTokenResponseData>
      >(REFRESH_ENDPOINT, { refreshToken }, refreshConfig);

      const payload = response.data;
      if (!payload.success) return null;

      const nextAccessToken = payload.data.token.accessToken;
      const nextRefreshToken = payload.data.token.refreshToken;

      this.setAuthToken(nextAccessToken, nextRefreshToken);
      this.updatePersistedSessionAuthData({
        accessToken: nextAccessToken,
        refreshToken: nextRefreshToken,
        user: payload.data.user,
        profile: payload.data.profile,
      });
      this.authEventHandlers.onSessionUpdated?.({
        token: {
          accessToken: nextAccessToken,
          refreshToken: nextRefreshToken,
        },
        user: payload.data.user,
        profile: payload.data.profile,
      });

      return nextAccessToken;
    } catch {
      return null;
    }
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh().finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
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

  setAuthToken(token: string, refreshToken?: string) {
    this.axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    if (typeof window !== "undefined") {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
      if (refreshToken) {
        this.updatePersistedSessionTokens(token, refreshToken);
      }
    }
  }

  clearAuthToken(options?: { notify?: boolean }) {
    delete this.axios.defaults.headers.common["Authorization"];
    this.clearPersistedSession();
    if (options?.notify) {
      this.authEventHandlers.onSessionCleared?.();
    }
  }

  setAuthEventHandlers(handlers: AuthEventHandlers) {
    this.authEventHandlers = handlers;
  }
}

export const apiClient = new ApiClient();
