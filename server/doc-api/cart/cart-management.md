# Cart Management API

Tài liệu cho các API quản lý giỏ hàng:

- `GET /api/cart` (lấy toàn bộ giỏ hàng)
- `PATCH /api/cart/items/:itemId` (cập nhật số lượng item)
- `DELETE /api/cart/items/:itemId` (xóa item khỏi giỏ)

---

## 1) Get All Cart

### Endpoint

`GET /api/cart`

### Authentication

Bắt buộc Bearer token:

```http
Authorization: Bearer <access_token>
```

### Success Response (`200 OK`)

```json
{
  "success": true,
  "data": {
    "cartId": "cart-uuid-123",
    "totalItems": 2,
    "totalQuantity": 5,
    "totalAmount": 299.98,
    "items": [
      {
        "itemId": "item-uuid-456",
        "productId": "product-uuid-789",
        "productName": "Nike Air Max 2024",
        "variantId": "550e8400-e29b-41d4-a716-446655440000",
        "variantSku": "NIKE-AM24-42-RED",
        "variantAttributes": {
          "size": "42",
          "color": "Red"
        },
        "quantity": 2,
        "unitPrice": 149.99,
        "subtotal": 299.98,
        "image": {
          "url": "https://cdn.example.com/images/nike-air-max-red-42.jpg",
          "altText": "Nike Air Max 2024 Red Size 42"
        }
      }
    ]
  },
  "message": "Cart retrieved successfully",
  "timestamp": "2026-03-18T08:00:00.000Z"
}
```

### Ghi chú nghiệp vụ

- Nếu user chưa có giỏ hàng, hệ thống tự tạo giỏ rỗng và trả về `200`.

### Error Response

#### `401 UNAUTHORIZED`

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or malformed Authorization header. Expected: Bearer <token>"
  }
}
```

---

## 2) Update Cart Item

### Endpoint

`PATCH /api/cart/items/:itemId`

### Authentication

```http
Authorization: Bearer <access_token>
```

### Path Params

| Param    | Type   | Required | Description                   |
| -------- | ------ | -------- | ----------------------------- |
| `itemId` | string | Yes      | ID của cart item cần cập nhật |

### Request Body

```json
{
  "quantity": 3
}
```

| Field      | Type    | Required | Description                     |
| ---------- | ------- | -------- | ------------------------------- |
| `quantity` | integer | Yes      | Số lượng mới của item, phải > 0 |

### Success Response (`200 OK`)

```json
{
  "success": true,
  "data": {
    "cartId": "cart-uuid-123",
    "totalItems": 2,
    "totalQuantity": 6,
    "totalAmount": 349.98,
    "items": []
  },
  "message": "Cart item updated successfully",
  "timestamp": "2026-03-18T08:00:00.000Z"
}
```

### Error Responses

#### `400 VALIDATION_ERROR`

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Quantity is required"
  }
}
```

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "quantity must be an integer"
  }
}
```

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "quantity must be greater than 0"
  }
}
```

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Quantity must be between 1 and 10. Received: 0"
  }
}
```

#### `404 NOT_FOUND`

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Cart item 00000000-0000-0000-0000-000000000000 not found"
  }
}
```

#### `409 CONFLICT`

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Cannot add more than 10 items of this variant to cart. Currently in cart: 2, Requested: 15"
  }
}
```

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Not enough stock available for variant NIKE-AM24-42-RED. Requested: 3, Available: 1"
  }
}
```

### Ghi chú nghiệp vụ

- Nếu tăng số lượng: hệ thống reserve thêm stock theo phần chênh lệch.
- Nếu giảm số lượng: hệ thống release stock theo phần chênh lệch.
- Mỗi variant trong giỏ tối đa `10`.

---

## 3) Remove Cart Item

### Endpoint

`DELETE /api/cart/items/:itemId`

### Authentication

```http
Authorization: Bearer <access_token>
```

### Path Params

| Param    | Type   | Required | Description          |
| -------- | ------ | -------- | -------------------- |
| `itemId` | string | Yes      | ID cart item cần xóa |

### Success Response (`200 OK`)

```json
{
  "success": true,
  "data": {
    "cartId": "cart-uuid-123",
    "totalItems": 1,
    "totalQuantity": 2,
    "totalAmount": 199.98,
    "items": []
  },
  "message": "Cart item removed successfully",
  "timestamp": "2026-03-18T08:00:00.000Z"
}
```

### Error Response

#### `404 NOT_FOUND`

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Cart item 00000000-0000-0000-0000-000000000000 not found"
  }
}
```

### Ghi chú nghiệp vụ

- Khi xóa item, hệ thống release toàn bộ `stockReserved` tương ứng với quantity của item đó.

---

## Error Format Chuẩn

Tất cả lỗi dùng format thống nhất:

```json
{
  "success": false,
  "error": {
    "code": "<ERROR_CODE>",
    "message": "<human readable message>",
    "details": null,
    "timestamp": "2026-03-18T08:00:00.000Z"
  }
}
```

---

## Tài liệu liên quan

- [doc-api/cart/get-cart.http](./get-cart.http)
- [doc-api/cart/update-cart-item.http](./update-cart-item.http)
- [doc-api/cart/remove-cart-item.http](./remove-cart-item.http)
- [doc-api/cart/add-to-cart.md](./add-to-cart.md)
