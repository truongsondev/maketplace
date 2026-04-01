import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

interface StoredUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  emailVerified?: boolean;
  status?: string;
}

interface AuthStorageState {
  user: StoredUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

interface AuthStoragePayload {
  state: AuthStorageState;
  version?: number;
}

interface RefreshTokenResponse {
  success: boolean;
  data: {
    token: {
      accessToken: string;
      refreshToken: string;
    };
    user: {
      id: string;
      email: string;
      emailVerified: boolean;
      status: string;
    };
    profile: {
      fullName?: string;
    } | null;
  };
  message: string;
  timestamp: string;
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (
  error: AxiosError | null,
  token: string | null = null,
) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    } else {
      prom.reject(new Error("Token refresh failed"));
    }
  });

  failedQueue = [];
};

export const apiClient = axios.create({
  baseURL: "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Dedicated client to avoid running auth interceptors during refresh.
const refreshClient = axios.create({
  baseURL: "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

const getAuthStoragePayload = (): AuthStoragePayload | null => {
  const authStorage = localStorage.getItem("auth-storage");
  if (!authStorage) {
    return null;
  }

  try {
    return JSON.parse(authStorage) as AuthStoragePayload;
  } catch (parseError) {
    console.error("Error parsing auth storage:", parseError);
    return null;
  }
};

const clearAuthState = () => {
  delete apiClient.defaults.headers.common["Authorization"];
  localStorage.removeItem("auth-storage");
};

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token from zustand store
    const token = localStorage.getItem("auth-storage");
    if (token) {
      try {
        const { state } = JSON.parse(token);
        if (state?.accessToken) {
          config.headers.Authorization = `Bearer ${state.accessToken}`;
        }
      } catch (error) {
        console.error("Error parsing token:", error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Ignore non-401 responses and already retried requests.
    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry
    ) {
      console.error("API Error:", error);
      return Promise.reject(error);
    }

    // Do not refresh when refresh endpoint itself fails.
    if (originalRequest.url?.includes("/auth/refresh-token")) {
      clearAuthState();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized - token expired or invalid
    if (!originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Get refresh token from persisted auth store
        const authPayload = getAuthStoragePayload();
        if (!authPayload) {
          throw new Error("No auth storage found");
        }

        const { state } = authPayload;
        const refreshToken = state?.refreshToken;

        if (!refreshToken) {
          throw new Error("No refresh token found");
        }

        // Call refresh token endpoint without bearer token
        const response = await refreshClient.post<RefreshTokenResponse>(
          "/auth/refresh-token",
          {
            refreshToken,
          },
        );

        if (response.data.success) {
          const { accessToken, refreshToken: newRefreshToken } =
            response.data.data.token;

          const refreshedUser: StoredUser = {
            id: response.data.data.user.id || state.user?.id || "",
            email: response.data.data.user.email || state.user?.email || "",
            name: response.data.data.profile?.fullName || state.user?.name,
            role: state.user?.role,
            emailVerified:
              response.data.data.user.emailVerified ??
              state.user?.emailVerified,
            status: response.data.data.user.status || state.user?.status,
          };

          // Update persisted auth state
          const updatedState = {
            ...state,
            user: refreshedUser,
            accessToken,
            refreshToken: newRefreshToken,
            isAuthenticated: true,
          };

          localStorage.setItem(
            "auth-storage",
            JSON.stringify({
              ...authPayload,
              state: updatedState,
            }),
          );

          // Update axios default header
          apiClient.defaults.headers.common["Authorization"] =
            `Bearer ${accessToken}`;

          // Process queued requests
          processQueue(null, accessToken);

          // Retry original request
          originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
        throw new Error("Refresh token API returned unsuccessful response");
      } catch (refreshError) {
        // Refresh failed, logout user
        processQueue(refreshError as AxiosError, null);
        clearAuthState();
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
