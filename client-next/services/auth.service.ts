import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse, ApiErrorResponse } from "@/types/api.types";
import type { User } from "@/types/registration.types";

// ─── Request / Response types ────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: {
    accessToken: string;
    refreshToken: string;
  };
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
}

export interface VerifyEmailResponse {
  message: string;
}

export interface LogoutRequest {
  refreshToken: string | null;
  accessToken: string | null;
}

export interface GoogleOAuthExchangeResponse {
  token: {
    accessToken: string;
    refreshToken: string;
  };
  user: User;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const authService = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      "api/auth/login",
      payload,
    );

    if (response.success) {
      return (response as ApiSuccessResponse<LoginResponse>).data;
    }

    throw response as ApiErrorResponse;
  },

  async register(payload: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>(
      "api/auth/register",
      payload,
    );

    if (response.success) {
      return (response as ApiSuccessResponse<RegisterResponse>).data;
    }

    throw response as ApiErrorResponse;
  },

  async verifyEmail(token: string): Promise<VerifyEmailResponse> {
    const response = await apiClient.get<VerifyEmailResponse>(
      `api/auth/verify-email?token=${token}`,
    );

    if (response.success) {
      return (response as ApiSuccessResponse<VerifyEmailResponse>).data;
    }

    throw response as ApiErrorResponse;
  },

  async logout(payload: LogoutRequest): Promise<void> {
    try {
      await apiClient.post("api/auth/logout", payload);
    } catch {
      console.log(
        "Logout API call failed, but we'll clear the session anyway.",
      );
    }
  },

  async exchangeGoogleOAuthCode(
    code: string,
  ): Promise<GoogleOAuthExchangeResponse> {
    const response = await apiClient.post<GoogleOAuthExchangeResponse>(
      "api/auth/google/exchange",
      { code },
    );

    if (response.success) {
      return (response as ApiSuccessResponse<GoogleOAuthExchangeResponse>).data;
    }

    throw response as ApiErrorResponse;
  },
};
