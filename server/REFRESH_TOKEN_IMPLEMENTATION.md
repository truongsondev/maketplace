# Refresh Token Implementation Summary

## Implemented Files

### 1. DTO (Data Transfer Objects)

- `src/module/auth/applications/dto/command/refresh-token.command.ts` - Request command
- `src/module/auth/applications/dto/result/refresh-token.result.ts` - Response result

### 2. Use Case

- `src/module/auth/applications/usecases/refresh-token.usecase.ts` - Business logic implementation

### 3. Ports

- `src/module/auth/applications/ports/input/refresh-token.usecase.ts` - Use case interface

### 4. Controller & API

- Updated `src/module/auth/interface-adapter/controller/auth.controller.ts`
- Updated `src/module/auth/infrastructure/api/auth.api.ts`

### 5. Dependency Injection

- Updated `src/module/auth/di.ts`

## API Endpoint

**POST** `/auth/refresh-token`

**Request Body:**

```json
{
  "refreshToken": "string"
}
```

**Response (Success 200):**

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": {
      "accessToken": "new_access_token",
      "refreshToken": "new_refresh_token"
    },
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "emailVerified": true,
      "status": "ACTIVE",
      ...
    },
    "profile": {
      ...
    }
  }
}
```

## Implementation Details

1. **Security**:
   - Validates refresh token by hashing and checking against database
   - Checks token expiration
   - Ensures token is not revoked
   - Validates user status (active and email verified)

2. **Token Rotation**:
   - Old refresh token is revoked after successful refresh
   - New access token and refresh token are generated
   - Access token stored in Redis with 1 hour TTL
   - New refresh token stored in database with device info

3. **Error Handling**:
   - Returns `InvalidCredentialsError` for:
     - Invalid or expired refresh token
     - User not found
     - Email not verified
     - User account not active

4. **Response Format**:
   - Same structure as login endpoint
   - Includes new token pair, user info, and profile

## Testing Commands

```bash
# First, login to get tokens
POST /auth/login
{
  "email": "user@example.com",
  "password": "password"
}

# Use the refreshToken from login response
POST /auth/refresh-token
{
  "refreshToken": "token_from_login"
}
```
