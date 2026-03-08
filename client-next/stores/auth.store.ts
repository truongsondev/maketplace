import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/registration.types";
import { apiClient } from "@/lib/api-client";

interface AuthState {
  user: User | null;
  token: {
    accessToken: string | null;
    refreshToken: string | null;
  };
  isAuthenticated: boolean;
  setSession: (params: {
    user: User;
    token: {
      accessToken: string;
      refreshToken: string;
    };
  }) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: {
        accessToken: null,
        refreshToken: null,
      },
      isAuthenticated: false,

      setSession: ({ user, token }) => {
        apiClient.setAuthToken(token.accessToken);
        set({
          user,
          token: {
            accessToken: token.accessToken,
            refreshToken: token.refreshToken,
          },
          isAuthenticated: true,
        });
      },

      clearSession: () => {
        apiClient.clearAuthToken();
        set({
          user: null,
          token: {
            accessToken: null,
            refreshToken: null,
          },
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "auth-session",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
