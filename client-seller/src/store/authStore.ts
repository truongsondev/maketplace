import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User, LoginRequest } from "@/types/auth";
import { authService } from "@/services/api";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials: LoginRequest) => {
        try {
          set({ isLoading: true });
          const response = await authService.login(credentials);

          if (response.success) {
            const { token, user: rawUser } = response.data;
            const accessToken = token.accessToken;

            // Transform user data to match User interface
            const user: User = {
              id: rawUser._id,
              email: rawUser._email.value,
              emailVerified: rawUser._emailVerified,
              status: rawUser._status,
            };

            // Set token to axios default headers
            apiClient.defaults.headers.common["Authorization"] =
              `Bearer ${accessToken}`;

            set({
              user,
              accessToken,
              isAuthenticated: true,
              isLoading: false,
            });

            toast.success("Đăng nhập thành công!");
          }
        } catch (error) {
          set({ isLoading: false });
          console.error("Login error:", error);
          toast.error("Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
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
            isAuthenticated: false,
            isLoading: false,
          });

          toast.success("Đã đăng xuất");
        }
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
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
