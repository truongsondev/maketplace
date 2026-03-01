/**
 * Standard API Response Types
 * Used for all API endpoints
 */

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp?: string;
  };
}

export interface ApiPaginatedResponse<T = any> {
  success: true;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message?: string;
  timestamp?: string;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Response Formatter
 * Static utility class for creating standardized API responses
 */
export class ResponseFormatter {
  static success<T>(data: T, message?: string): ApiSuccessResponse<T> {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  static error(
    code: string,
    message: string,
    details?: Record<string, any>,
  ): ApiErrorResponse {
    return {
      success: false,
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
      },
    };
  }

  static paginated<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
    message?: string,
  ): ApiPaginatedResponse<T> {
    return {
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      message,
      timestamp: new Date().toISOString(),
    };
  }
}
