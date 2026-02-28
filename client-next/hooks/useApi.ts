import { useState, useCallback, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import {
  ApiResponse,
  ApiErrorResponse,
  ApiSuccessResponse,
} from "@/types/api.types";

interface UseApiState<T> {
  data: T | null;
  error: ApiErrorResponse | null;
  loading: boolean;
}

export function useApi<T = any>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    error: null,
    loading: false,
  });

  const execute = useCallback(
    async (request: () => Promise<ApiResponse<T>>) => {
      setState({ data: null, error: null, loading: true });

      try {
        const response = await request();

        if (response.success) {
          const successResponse = response as ApiSuccessResponse<T>;
          setState({
            data: successResponse.data,
            error: null,
            loading: false,
          });
          return { success: true, data: successResponse.data };
        }
      } catch (error) {
        const apiError = error as ApiErrorResponse;
        setState({
          data: null,
          error: apiError,
          loading: false,
        });
        return { success: false, error: apiError };
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setState({ data: null, error: null, loading: false });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

export function useMutation<T = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiErrorResponse | null>(null);

  const mutate = useCallback(async (request: () => Promise<ApiResponse<T>>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await request();

      if (response.success) {
        setLoading(false);
        return response as ApiSuccessResponse<T>;
      }
    } catch (err) {
      const apiError = err as ApiErrorResponse;
      setError(apiError);
      setLoading(false);
      throw apiError;
    }
  }, []);

  return {
    mutate,
    loading,
    error,
  };
}

interface UseQueryOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
}

export function useQuery<T = any>(url: string, options: UseQueryOptions = {}) {
  const { enabled = true, refetchOnMount = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiErrorResponse | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<T>(url);

      if (response.success) {
        const successResponse = response as ApiSuccessResponse<T>;
        setData(successResponse.data);
      }
    } catch (err) {
      const apiError = err as ApiErrorResponse;
      setError(apiError);
    } finally {
      setLoading(false);
    }
  }, [url, enabled]);

  useEffect(() => {
    if (refetchOnMount) {
      fetchData();
    }
  }, [fetchData, refetchOnMount]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
