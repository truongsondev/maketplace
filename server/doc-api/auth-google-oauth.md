# Auth - Google OAuth API

API login bằng Google (OAuth 2.0) cho user mua hàng.

## Cấu hình ENV

- `FRONTEND_URL` (vd: `http://localhost:3000`)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL` (vd: `http://localhost:8080/api/auth/google/callback`)
- `GOOGLE_OAUTH_CODE_TTL_SECONDS` (default `60`)

## Flow

1. Frontend redirect user sang backend:

- `GET /api/auth/google?redirect=/path-after-login`

2. User login/consent tại Google, Google redirect về backend callback:

- `GET /api/auth/google/callback`

3. Backend redirect về frontend callback với `code` (one-time, TTL ngắn):

- `GET {FRONTEND_URL}/auth/google/callback?code=...&redirect=/path-after-login`

4. Frontend exchange `code` lấy token:

- `POST /api/auth/google/exchange`

## 1) Start OAuth

- Method: `GET`
- URL: `/api/auth/google`
- Query:
  - `redirect` (optional): đường dẫn nội bộ frontend, bắt đầu bằng `/`

### Response

- Redirect 302 sang Google.

## 2) OAuth Callback

- Method: `GET`
- URL: `/api/auth/google/callback`

### Response

- Redirect 302 về `{FRONTEND_URL}/auth/google/callback?code=...`.

## 3) Exchange Code

- Method: `POST`
- URL: `/api/auth/google/exchange`
- Body:

```json
{
  "code": "string"
}
```

### Success 200

```json
{
  "success": true,
  "data": {
    "token": {
      "accessToken": "...",
      "refreshToken": "..."
    },
    "user": {
      "id": "...",
      "email": "..."
    }
  },
  "message": "Google login successful",
  "timestamp": "..."
}
```

### Error 400

- `Code is required`
- `Code is invalid or expired`
