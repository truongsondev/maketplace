# Refresh Token API

Tai lieu mo ta API cap lai token khi access token het han.

## Endpoint

- Method: POST
- URL: /api/auth/refresh-token
- Auth header: Khong bat buoc (khong can Bearer access token)
- Content-Type: application/json

## Request Body

```json
{
  "refreshToken": "string"
}
```

### Validation

- refreshToken bat buoc phai co.
- refreshToken phai la string.
- Neu thieu hoac sai kieu se tra ve 400.

## Response Thanh Cong

- HTTP Status: 200 OK

```json
{
  "success": true,
  "data": {
    "token": {
      "accessToken": "new_access_token",
      "refreshToken": "new_refresh_token"
    },
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "emailVerified": true,
      "status": "ACTIVE"
    },
    "profile": {
      "fullName": "Nguyen Van A"
    }
  },
  "message": "Token refreshed successfully",
  "timestamp": "2026-03-22T09:00:00.000Z"
}
```

## Response Loi Thuong Gap

### 1) Thieu refreshToken

- HTTP Status: 400 Bad Request
- Error code: VALIDATION_ERROR

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Refresh token is required",
    "timestamp": "2026-03-22T09:00:00.000Z"
  }
}
```

### 2) Refresh token khong hop le/het han/da revoke

- HTTP Status: 401 Unauthorized
- Error code: INVALID_CREDENTIALS
- Luu y: khi refresh that bai (token khong hop le, user khong hop le, hoac loi he thong trong qua trinh refresh), server van co gang thu hoi refresh token dang duoc gui len.

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email/phone or password",
    "timestamp": "2026-03-22T09:00:00.000Z"
  }
}
```

## Response Mau Day Du

### 1) Success (user co profile)

```json
{
  "success": true,
  "data": {
    "token": {
      "accessToken": "atk_6f0e4f2f9f3e4adca7c27cfb5dd9f9a1",
      "refreshToken": "rtk_9975f4f95fbc46ed9be2f4b4d4f7b53a"
    },
    "user": {
      "id": "6f04a3e8-7f3f-4eb7-9fe6-4d7f178fd7ca",
      "email": "user@example.com",
      "phone": null,
      "emailVerified": true,
      "phoneVerified": false,
      "status": "ACTIVE",
      "lastLogin": null,
      "createdAt": "2026-03-21T08:12:02.112Z",
      "updatedAt": "2026-03-22T09:40:10.001Z"
    },
    "profile": {
      "userId": "6f04a3e8-7f3f-4eb7-9fe6-4d7f178fd7ca",
      "fullName": "Nguyen Van A",
      "avatarUrl": null,
      "gender": null,
      "birthday": null,
      "createdAt": "2026-03-21T08:12:02.990Z",
      "updatedAt": "2026-03-21T08:12:02.990Z"
    }
  },
  "message": "Token refreshed successfully",
  "timestamp": "2026-03-22T09:40:10.050Z"
}
```

### 2) Success (user chua co profile)

```json
{
  "success": true,
  "data": {
    "token": {
      "accessToken": "atk_2d5960f6bb8a4a14a2478b2ba44c9d16",
      "refreshToken": "rtk_7e6c0d09a4be4b3aa6ce1ab4f2cf88e6"
    },
    "user": {
      "id": "0a9d4c89-0fd2-4de6-9f9b-1c2b4aa6dd90",
      "email": "newuser@example.com",
      "phone": null,
      "emailVerified": true,
      "phoneVerified": false,
      "status": "ACTIVE",
      "lastLogin": null,
      "createdAt": "2026-03-22T07:00:00.000Z",
      "updatedAt": "2026-03-22T09:45:00.000Z"
    },
    "profile": null
  },
  "message": "Token refreshed successfully",
  "timestamp": "2026-03-22T09:45:00.120Z"
}
```

### 3) Bad Request (thieu refreshToken)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Refresh token is required",
    "timestamp": "2026-03-22T09:41:22.214Z"
  }
}
```

### 4) Unauthorized (refresh token khong hop le)

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email/phone or password",
    "timestamp": "2026-03-22T09:42:10.333Z"
  }
}
```

### 5) Unauthorized (refresh that bai do loi he thong)

- HTTP Status: 401 Unauthorized
- Error code: INVALID_CREDENTIALS

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email/phone or password",
    "timestamp": "2026-03-22T09:43:05.010Z"
  }
}
```

## Luong Xu Ly (Server)

1. Nhan refreshToken tu request body.
2. Hash refreshToken.
3. Tim trong bang refresh_tokens voi dieu kien:
- token trung voi token da hash
- revoked = false
- expires_at > hien tai
4. Neu khong tim thay: tra loi INVALID_CREDENTIALS.
5. Lay user theo user_id trong token record.
6. Kiem tra user hop le:
- user ton tai
- emailVerified = true
- status = ACTIVE
7. Tao cap token moi:
- accessToken moi
- refreshToken moi
8. Revoke refresh token cu.
9. Luu refresh token moi vao database.
10. Luu session access token moi vao Redis voi TTL 3600 giay.
11. Tra response thanh cong voi token moi + user + profile.
12. Neu bat ky buoc nao that bai sau khi nhan refreshToken:
- Server van co gang revoke refresh token dang duoc gui len.
- API tra ve 401 voi error code INVALID_CREDENTIALS.

## Token Rotation

API nay dung co che rotate refresh token:

- Moi lan refresh thanh cong, refresh token cu se bi revoke.
- Neu refresh that bai, refresh token dang gui len cung se bi revoke (best-effort).
- Client bat buoc cap nhat va luu refreshToken moi tu response.
- Neu client tiep tuc dung refresh token cu, request sau do se fail 401.

## cURL Example

```bash
curl -X POST "http://localhost:8080/api/auth/refresh-token" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your_refresh_token_here"
  }'
```

## Ghi Chu Tich Hop Frontend

- Khi API bat ky tra 401 do access token het han, frontend goi /api/auth/refresh-token.
- Neu refresh thanh cong: cap nhat accessToken + refreshToken moi, sau do retry request cu.
- Neu refresh that bai (401): day user ve man hinh dang nhap.
