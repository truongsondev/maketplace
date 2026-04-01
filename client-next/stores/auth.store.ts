import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/registration.types";
import { apiClient } from "@/lib/api-client";
import type { UserProfile } from "@/types/auth.types";

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  token: {
    accessToken: string | null;
    refreshToken: string | null;
  };
  isAuthenticated: boolean;
  setSession: (params: {
    user: User;
    profile?: UserProfile | null;
    token: {
      accessToken: string;
      refreshToken: string;
    };
  }) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      if (typeof window !== "undefined") {
        apiClient.setAuthEventHandlers({
          onSessionUpdated: ({ token, user, profile }) => {
            set({
              user: (user as User) ?? get().user,
              profile: (profile as UserProfile | null) ?? get().profile,
              token: {
                accessToken: token.accessToken,
                refreshToken: token.refreshToken,
              },
              isAuthenticated: true,
            });
          },
          onSessionCleared: () => {
            set({
              user: null,
              profile: null,
              token: {
                accessToken: null,
                refreshToken: null,
              },
              isAuthenticated: false,
            });
          },
        });
      }

      return {
      user: null,
      profile: null,
      token: {
        accessToken: null,
        refreshToken: null,
      },
      isAuthenticated: false,

      setSession: ({ user, token, profile = null }) => {
        apiClient.setAuthToken(token.accessToken, token.refreshToken);
        set({
          user,
          profile,
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
          profile: null,
          token: {
            accessToken: null,
            refreshToken: null,
          },
          isAuthenticated: false,
        });
      },
      };
    },
    {
      name: "auth-session",
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
