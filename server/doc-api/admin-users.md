# Admin Users API

## Base URL

`/api/admin/users`

## Authentication

- Header: `Authorization: Bearer <access_token>`
- Role: `ADMIN`

## 1) GET /api/admin/users

Lay danh sach users voi filter + pagination.

### Query

- `page?: number` (default: 1)
- `limit?: number` (default: 20, max: 100)
- `search?: string` (id, email, phone)
- `status?: ACTIVE | SUSPENDED | BANNED`
- `role?: ADMIN | BUYER`
- `emailVerified?: boolean`
- `sortBy?: createdAt | lastLogin | email`
- `sortOrder?: asc | desc`

### Response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "email": "buyer@example.com",
        "phone": null,
        "status": "ACTIVE",
        "emailVerified": true,
        "lastLogin": "2026-04-09T09:30:00.000Z",
        "createdAt": "2026-04-01T08:00:00.000Z",
        "updatedAt": "2026-04-09T09:30:00.000Z",
        "role": "BUYER"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    },
    "aggregations": {
      "statusCount": {
        "active": 80,
        "suspended": 15,
        "banned": 5
      },
      "roleCount": {
        "admin": 3,
        "buyer": 97
      }
    }
  },
  "message": "Users fetched successfully"
}
```

## 2) GET /api/admin/users/:id

Lay chi tiet user.

### Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "buyer@example.com",
    "phone": null,
    "status": "ACTIVE",
    "emailVerified": true,
    "lastLogin": "2026-04-09T09:30:00.000Z",
    "createdAt": "2026-04-01T08:00:00.000Z",
    "updatedAt": "2026-04-09T09:30:00.000Z",
    "role": "BUYER",
    "addressesCount": 2,
    "ordersCount": 4,
    "totalSpent": 3200000,
    "activities": []
  },
  "message": "User fetched successfully"
}
```

## 3) PATCH /api/admin/users/:id/status

Cap nhat trang thai user.

### Body

```json
{
  "status": "SUSPENDED",
  "reason": "Vi pham chinh sach"
}
```

### Rules

- Khong cho phep admin tu suspend/ban chinh minh.
- Khong cho phep `BANNED -> ACTIVE`.
- Neu status moi la `SUSPENDED`/`BANNED`, he thong revoke refresh token hien tai.

## 4) PATCH /api/admin/users/:id/role

Chuyen role giua ADMIN va BUYER.

### Body

```json
{
  "role": "BUYER",
  "reason": "Dieu chinh quyen"
}
```

### Rules

- Khong cho phep admin tu remove role ADMIN cua chinh minh.
- Luon dam bao con toi thieu 1 ADMIN active.

## 5) GET /api/admin/users/:id/audits

Lay lich su thay doi role/status cua user.

### Query

- `page?: number`
- `limit?: number`

## 6) GET /api/admin/users/export

Xuat CSV users theo bo filter tuong tu endpoint list.
