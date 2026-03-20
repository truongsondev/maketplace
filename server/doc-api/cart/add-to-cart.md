# Add To Cart API

## Endpoint

`POST /api/cart/items`

## Mô tả

Thêm 1 biến thể sản phẩm (`variant`) vào giỏ hàng của user đang đăng nhập.

- Nếu biến thể **đã có** trong giỏ: cộng dồn số lượng.
- Nếu biến thể **chưa có** trong giỏ: tạo item mới.

## Authentication

Bắt buộc gửi access token:

```http
Authorization: Bearer <access_token>
```

Nếu thiếu/sai định dạng header, API trả về `401 UNAUTHORIZED`.

## Request Headers

```http
Content-Type: application/json
Authorization: Bearer <access_token>
```

## Request Body

```json
{
  "variantId": "550e8400-e29b-41d4-a716-446655440000",
  "quantity": 2
}
```

### Body fields

| Field       | Kiểu             | Bắt buộc | Mô tả                                      |
| ----------- | ---------------- | -------- | ------------------------------------------ |
| `variantId` | string           | Có       | ID của biến thể sản phẩm                   |
| `quantity`  | number (integer) | Có       | Số lượng thêm vào, phải là số nguyên dương |

## Success Response

### `200 OK`

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
  "message": "Product added to cart successfully",
  "timestamp": "2026-03-18T08:00:00.000Z"
}
```

> `image` có thể không có (undefined) nếu không tìm thấy ảnh phù hợp.

## Error Responses

Format lỗi chuẩn:

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

### `400 VALIDATION_ERROR`

#### Thiếu field bắt buộc

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "VariantId is required"
  }
}
```

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Quantity is required"
  }
}
```

#### Sai kiểu dữ liệu

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "variantId must be a string"
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

#### Quantity không hợp lệ

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Quantity must be between 1 and 10. Received: 0"
  }
}
```

### `401 UNAUTHORIZED`

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or malformed Authorization header. Expected: Bearer <token>"
  }
}
```

### `404 NOT_FOUND`

#### Variant không tồn tại hoặc đã bị xóa mềm

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Variant does not exist or has been deleted"
  }
}
```

#### Product đã bị xóa mềm

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Product does not exist or has been deleted"
  }
}
```

### `409 CONFLICT`

#### Không đủ tồn kho

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Not enough stock available for variant NIKE-AM24-42-RED. Requested: 5, Available: 2"
  }
}
```

#### Vượt quá số lượng tối đa mỗi biến thể trong giỏ

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Cannot add more than 10 items of this variant to cart. Currently in cart: 8, Requested: 11"
  }
}
```

## Business Rules

1. `variantId` là bắt buộc.
2. `quantity` phải là số nguyên dương.
3. Mỗi biến thể chỉ được tối đa `10` sản phẩm trong giỏ.
4. Tồn kho khả dụng để check khi thêm giỏ:

   `availableStock = stockAvailable - stockReserved`

5. Sau khi thêm vào giỏ thành công, hệ thống tăng `stockReserved` theo số lượng vừa thêm.
6. Variant/Product bị soft-delete sẽ không được thêm vào giỏ (`404`).

## Ví dụ gọi API

```bash
curl -X POST http://localhost:5000/api/cart/items \
  -H "Authorization: Bearer <your_access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "variantId": "550e8400-e29b-41d4-a716-446655440000",
    "quantity": 2
  }'
```

## Tài liệu liên quan

- [doc-api/cart/add-to-cart.http](./add-to-cart.http)
- [docs/ba/addToCart.md](../../docs/ba/addToCart.md)
- [prisma/schema.prisma](../../prisma/schema.prisma)
