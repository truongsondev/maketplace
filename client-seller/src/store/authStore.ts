import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User, LoginRequest } from "@/types/auth";
import { authService } from "@/services/api";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import { AxiosError } from "axios";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
}

const getLoginErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const code = (error.response?.data as { error?: { code?: string } })?.error
      ?.code;

    if (status === 429 || code === "RATE_LIMIT_EXCEEDED") {
      return "Bạn đã đăng nhập quá nhiều lần. Vui lòng thử lại sau.";
    }

    if (status === 400) {
      const apiMessage = (
        error.response?.data as { error?: { message?: string } }
      )?.error?.message;
      return apiMessage || "Thông tin đăng nhập không hợp lệ.";
    }

    if (status === 401 || code === "INVALID_CREDENTIALS") {
      return "Email hoặc mật khẩu không đúng, hoặc tài khoản không có quyền ADMIN.";
    }
  }

  return "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
};

const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials: LoginRequest) => {
        try {
          const normalizedEmail = credentials.email.trim();
          const password = credentials.password;

          if (!normalizedEmail) {
            throw new Error("EMAIL_REQUIRED");
          }

          if (!isValidEmail(normalizedEmail)) {
            throw new Error("EMAIL_INVALID");
          }

          if (!password || password.length < 6) {
            throw new Error("PASSWORD_TOO_SHORT");
          }

          set({ isLoading: true });
          const response = await authService.login({
            email: normalizedEmail,
            password,
          });

          if (response.success) {
            const { token, user: rawUser } = response.data;
            const accessToken = token.accessToken;
            const refreshToken = token.refreshToken;

            const user: User = {
              id: rawUser.id,
              email: rawUser.email,
              fullName: rawUser.fullName,
              avatarUrl: rawUser.avatarUrl,
              roles: rawUser.roles,
            };

            if (!user.roles.includes("ADMIN")) {
              throw new Error("INVALID_ADMIN_ROLE");
            }

            apiClient.defaults.headers.common["Authorization"] =
              `Bearer ${accessToken}`;

            set({
              user,
              accessToken,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
            });

            toast.success("Đăng nhập thành công!");
            return;
          }

          throw new Error("LOGIN_FAILED");
        } catch (error) {
          set({ isLoading: false });
          console.error("Login error:", error);
          if (
            error instanceof Error &&
            (error.message === "INVALID_ADMIN_ROLE" ||
              error.message === "LOGIN_FAILED")
          ) {
            toast.error(
              "Email hoặc mật khẩu không đúng, hoặc tài khoản không có quyền ADMIN.",
            );
            throw error;
          }

          if (error instanceof Error && error.message === "EMAIL_REQUIRED") {
            toast.error("email is required");
            throw error;
          }

          if (error instanceof Error && error.message === "EMAIL_INVALID") {
            toast.error("email must be a valid email");
            throw error;
          }

          if (
            error instanceof Error &&
            error.message === "PASSWORD_TOO_SHORT"
          ) {
            toast.error("password must be at least 6 characters");
            throw error;
          }

          toast.error(getLoginErrorMessage(error));
          throw error;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          // Clear token from axios
          delete apiClient.defaults.headers.common["Authorization"];

          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          });

          toast.success("Đã đăng xuất");
        }
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      setTokens: (accessToken: string, refreshToken: string) => {
        apiClient.defaults.headers.common["Authorization"] =
          `Bearer ${accessToken}`;
        set({ accessToken, refreshToken });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

// Initialize axios interceptor on app load
const token = useAuthStore.getState().accessToken;
if (token) {
  apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}
