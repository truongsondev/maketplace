# Admin Auth - Login API

Tai lieu mo ta API dang nhap danh rieng cho admin.

## Endpoint

- Method: POST
- URL: /api/admin/auth/login
- Auth header: Khong bat buoc (public endpoint)
- Content-Type: application/json

## Muc tieu

API nay chi cho phep user co role ADMIN dang nhap.
Neu user khong co role ADMIN hoac thong tin dang nhap khong hop le thi khong duoc cap token.

## Request Body

```json
{
  "email": "admin@example.com",
  "password": "123456"
}
```

## Validation

- email: bat buoc, dung format email
- password: bat buoc, la string, toi thieu 6 ky tu

## Luong xu ly chinh

1. Validate input (email/password)
2. Check rate limit theo email/IP
3. Tim user theo email va lay roles
4. So sanh password hash
5. Bat buoc thoa tat ca dieu kien:

- emailVerified = true
- status = ACTIVE
- co role ADMIN

6. Tao accessToken + refreshToken
7. Luu session access token vao Redis (TTL 3600s)
8. Luu refresh token da hash vao DB
9. Tra ve token + thong tin user

## Response Thanh Cong

- HTTP status: 200 OK

```json
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "token": {
      "accessToken": "atk_xxx",
      "refreshToken": "rtk_xxx"
    },
    "user": {
      "id": "user-uuid",
      "email": "admin@example.com",
      "fullName": "Admin User",
      "avatarUrl": "https://cdn.example.com/avatar.jpg",
      "roles": ["ADMIN"]
    }
  },
  "timestamp": "2026-04-03T10:00:00.000Z"
}
```

## Response Loi Thuong Gap

### 1) Thieu field bat buoc

- HTTP status: 400 Bad Request

Vi du:

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "email is required"
  }
}
```

### 2) Email sai format

- HTTP status: 400 Bad Request

### 3) Password ngan hon 6 ky tu

- HTTP status: 400 Bad Request

### 4) Sai email/password hoac khong co role ADMIN

- HTTP status: 401 Unauthorized
- Error code: INVALID_CREDENTIALS

Luu y bao mat: API khong tiet lo ly do cu the (sai mat khau, chua verify email, user bi khoa, hay thieu role ADMIN), tat ca tra ve loi thong nhat.

### 5) Vuot gioi han tan suat

- HTTP status: 429 Too Many Requests
- Error code: RATE_LIMIT_EXCEEDED

## cURL Example

```bash
curl -X POST "http://localhost:8080/api/admin/auth/login" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "admin@example.com",
    "password": "123456"
  }'
```

## Ghi chu tich hop frontend

- Sau khi login thanh cong, client luu accessToken va refreshToken nhu flow auth thong thuong.
- Dung accessToken de goi cac API admin can role ADMIN (vi du: /api/admin/products).
- Khi access token het han, client goi /api/auth/refresh-token de rotate token.
