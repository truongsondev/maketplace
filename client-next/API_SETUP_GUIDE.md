# API Response Handler Setup - Complete Guide

## Overview

Your application now has a standardized API response handling system that works globally for all API endpoints. All responses follow a consistent format.

## Files Created

### 1. **[types/api.types.ts](types/api.types.ts)** - Response Type Definitions

Contains all TypeScript interfaces and the `ResponseFormatter` utility class.

**Key Types:**

- `ApiSuccessResponse<T>` - Success responses
- `ApiErrorResponse` - Error responses
- `ApiPaginatedResponse<T>` - Paginated data responses
- `ApiResponse<T>` - Union type for all responses

### 2. **[lib/api-client.ts](lib/api-client.ts)** - Global API Client

Singleton API client with automatic response/error handling.

**Features:**

- ✅ Automatic response transformation
- ✅ Request/response interceptors
- ✅ Auth token management
- ✅ Standardized error handling
- ✅ Timeout configuration

**Methods:**

```typescript
apiClient.get<T>(url, config?)
apiClient.post<T>(url, data, config?)
apiClient.put<T>(url, data, config?)
apiClient.patch<T>(url, data, config?)
apiClient.delete<T>(url, config?)
apiClient.setAuthToken(token)
apiClient.clearAuthToken()
```

### 3. **[hooks/useApi.ts](hooks/useApi.ts)** - React Hooks

Custom React hooks for easy API integration in components.

**Available Hooks:**

- `useApi<T>()` - Generic API calls with full state management
- `useMutation<T>()` - For POST/PUT/DELETE operations
- `useQuery<T>(url, options)` - For GET requests with auto-fetch

### 4. **[lib/api-examples.ts](lib/api-examples.ts)** - Usage Examples

Practical examples for different API call scenarios.

---

## Response Format

### Success Response (HTTP 200)

```json
{
  "success": true,
  "data": {
    /* any data */
  },
  "message": "Operation successful",
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

### Error Response (HTTP 4xx/5xx)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": { "field": "email", "reason": "format" },
    "timestamp": "2026-01-30T10:00:00.000Z"
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [
    /* array items */
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  },
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

---

## Quick Start Guide

### Option 1: Simple Service (No React Components)

```typescript
// services/product.service.ts
import { apiClient } from "@/lib/api-client";
import { ApiSuccessResponse, ApiErrorResponse } from "@/types/api.types";

export async function getProducts(page: number = 1) {
  try {
    const response = await apiClient.get<any[]>(`/api/products?page=${page}`);

    if (response.success) {
      return (response as ApiSuccessResponse<any[]>).data;
    }
  } catch (error) {
    const apiError = error as ApiErrorResponse;
    console.error("Error:", apiError.error.message);
    throw apiError;
  }
}
```

### Option 2: React Component with useApi Hook

```typescript
// components/ProductList.tsx
import { useApi } from "@/hooks/useApi";
import { apiClient } from "@/lib/api-client";

export function ProductList() {
  const { data: products, loading, error, execute } = useApi();

  useEffect(() => {
    execute(() => apiClient.get("/api/products"));
  }, [execute]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.error.message}</div>;

  return (
    <div>
      {products?.map((product) => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

### Option 3: React Component with useMutation Hook

```typescript
// components/LoginForm.tsx
import { useMutation } from "@/hooks/useApi";
import { apiClient } from "@/lib/api-client";

export function LoginForm() {
  const { mutate, loading, error } = useMutation<{
    accessToken: string;
    user: any;
  }>();

  const handleSubmit = async (email: string, password: string) => {
    try {
      const result = await mutate(() =>
        apiClient.post("/api/auth/login", { email, password })
      );
      apiClient.setAuthToken(result.data.accessToken);
      // Handle login success
    } catch (err) {
      console.error("Login failed");
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSubmit("user@example.com", "password");
    }}>
      {error && <div className="error">{error.error.message}</div>}
      <button disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
```

### Option 4: React Component with useQuery Hook

```typescript
// components/UserProfile.tsx
import { useQuery } from "@/hooks/useApi";

export function UserProfile() {
  const { data: user, loading, error, refetch } = useQuery<{
    id: string;
    name: string;
    email: string;
  }>("/api/users/profile", {
    enabled: true,
    refetchOnMount: true,
  });

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p className="error">Error: {error.error.message}</p>}
      {user && (
        <div>
          <h1>{user.name}</h1>
          <p>{user.email}</p>
          <button onClick={() => refetch()}>Refresh</button>
        </div>
      )}
    </div>
  );
}
```

---

## Updating Existing Services

### Before (Old Way)

```typescript
// services/registration.service.ts
const apiClient: AxiosInstance = axios.create({...});

export const registrationService = {
  async sendOTP(data: SendOTPRequest): Promise<SendOTPResponse> {
    try {
      const response = await apiClient.post<SendOTPResponse>(
        "/api/auth/register/send-otp",
        data,
      );
      return response.data;
    } catch (error) {
      throw handleAxiosError(error as AxiosError<any>);
    }
  },
};
```

### After (New Way)

```typescript
// services/registration.service.ts
import { apiClient } from "@/lib/api-client";
import { ApiSuccessResponse, ApiErrorResponse } from "@/types/api.types";

export const registrationService = {
  async sendOTP(data: SendOTPRequest): Promise<SendOTPResponse> {
    try {
      const response = await apiClient.post<SendOTPResponse>(
        "/api/auth/register/send-otp",
        data,
      );

      if (response.success) {
        return (response as ApiSuccessResponse<SendOTPResponse>).data;
      }
    } catch (error) {
      const apiError = error as ApiErrorResponse;
      throw apiError;
    }
  },
};
```

---

## Error Handling Pattern

The API client automatically handles errors and throws `ApiErrorResponse` objects.

```typescript
try {
  const response = await apiClient.post("/api/users", userData);
  if (response.success) {
    console.log("Success:", response.data);
  }
} catch (error) {
  const apiError = error as ApiErrorResponse;

  // Access error details
  console.log("Code:", apiError.error.code); // e.g., "VALIDATION_ERROR"
  console.log("Message:", apiError.error.message); // User-friendly message
  console.log("Details:", apiError.error.details); // Additional context
  console.log("Timestamp:", apiError.error.timestamp); // When error occurred
}
```

---

## Authentication Token Management

```typescript
// Set token after login
apiClient.setAuthToken(accessToken);

// Token is automatically included in all requests:
// Authorization: Bearer {token}

// Clear token on logout
apiClient.clearAuthToken();
```

---

## Best Practices

1. **Always use type generics:**

   ```typescript
   await apiClient.get<UserType>("/api/users");
   ```

2. **Handle both success and error cases:**

   ```typescript
   if (response.success) {
     // Handle success
   } else {
     // Handle error (only in error catch block)
   }
   ```

3. **Use React hooks in components for cleaner code:**

   ```typescript
   const { data, loading, error } = useQuery("/api/data");
   ```

4. **Type-guard for paginated responses:**

   ```typescript
   if (response.success && "pagination" in response) {
     // It's a paginated response
   }
   ```

5. **Consistent error messages:**
   ```typescript
   catch (error) {
     const apiError = error as ApiErrorResponse;
     console.error(apiError.error.message); // Always available
   }
   ```

---

## API Client Configuration

Edit [lib/api-client.ts](lib/api-client.ts) to customize:

- **Base URL:** Change `API_BASE_URL` in the constructor
- **Timeout:** Modify the `timeout` property (currently 10000ms)
- **Headers:** Add custom headers in `axios.create()` config
- **Interceptors:** Extend request/response interceptors for custom logic

Example:

```typescript
// Add custom header
this.axiosInstance.defaults.headers.common["X-Custom-Header"] = "value";

// Change timeout
this.axiosInstance.defaults.timeout = 20000;
```

---

## Troubleshooting

### "Cannot read property 'success' of undefined"

Make sure the server is returning a proper `ApiResponse` format.

### "Token not being sent"

Check that token is set: `apiClient.setAuthToken(token)`

### "Type errors with response.data"

Use type generics: `apiClient.get<T>("/url")` instead of `apiClient.get("/url")`

### "Circular dependency errors"

Avoid importing services inside types files. Keep types in `types/` and services in `services/`

---

## Summary

✅ Standardized response format across all APIs
✅ Automatic error handling and transformation
✅ Auth token management
✅ React hooks for easy component integration
✅ Type-safe with TypeScript support
✅ Easy to maintain and extend

All new API calls should use `apiClient` from [lib/api-client.ts](lib/api-client.ts)!
