import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (
  error: AxiosError | null,
  token: string | null = null,
) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
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

    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Get refresh token from localStorage
        const authStorage = localStorage.getItem("auth-storage");
        if (!authStorage) {
          throw new Error("No auth storage found");
        }

        const { state } = JSON.parse(authStorage);
        const refreshToken = state?.refreshToken;

        if (!refreshToken) {
          throw new Error("No refresh token found");
        }

        // Call refresh token endpoint
        const response = await apiClient.post("/auth/refresh-token", {
          refreshToken,
        });

        if (response.data.success) {
          const { accessToken, refreshToken: newRefreshToken } =
            response.data.data.token;

          // Update tokens in localStorage
          const updatedState = {
            ...state,
            accessToken,
            refreshToken: newRefreshToken,
          };
          localStorage.setItem(
            "auth-storage",
            JSON.stringify({ state: updatedState }),
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
      } catch (refreshError) {
        // Refresh failed, logout user
        processQueue(refreshError as AxiosError, null);
        localStorage.removeItem("auth-storage");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle common errors
    console.error("API Error:", error);
    return Promise.reject(error);
  },
);
