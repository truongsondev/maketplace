# Reviews API

Tính năng: khách hàng đánh giá sản phẩm sau khi đơn hàng **DELIVERED**.

## Endpoints

### 1) Generate Cloudinary upload signature

- Method: `POST`
- Path: `/api/reviews/cloudinary/sign`
- Auth: Bearer token (user)
- Body:
  - `orderId` (optional): dùng để nhóm ảnh theo order

Response (success):

```json
{
  "success": true,
  "data": {
    "cloudName": "...",
    "apiKey": "...",
    "timestamp": 1710000000,
    "folder": "reviews/<userId>/<orderId>",
    "signature": "..."
  },
  "message": "Signature generated successfully"
}
```

Client flow: dùng `signature` + `folder` để upload trực tiếp lên Cloudinary, lấy `secure_url` và `public_id`, rồi gửi về server khi tạo review.

### 2) Get review status for an order

- Method: `GET`
- Path: `/api/reviews/orders/:orderId/status`
- Auth: Bearer token (user)

Response (success):

```json
{
  "success": true,
  "data": {
    "orderId": "...",
    "items": [
      {
        "orderItemId": "...",
        "reviewed": true,
        "reviewId": "..."
      }
    ]
  },
  "message": "Order review status retrieved successfully"
}
```

### 3) Create review

- Method: `POST`
- Path: `/api/reviews`
- Auth: Bearer token (user)

Body:

- `orderItemId` (required)
- `rating` (required): integer 1..5
- `comment` (optional)
- `images` (optional): tối đa 6 ảnh
  - `url` (required)
  - `publicId` (optional)

Behavior:

- Chỉ cho phép review khi order của `orderItemId` thuộc user và status là `DELIVERED`.
- Idempotent theo `(userId, orderItemId)`:
  - Nếu đã review, API trả 200 với `alreadyExists=true`.

Response (success):

```json
{
  "success": true,
  "data": {
    "reviewId": "...",
    "message": "Review created successfully",
    "alreadyExists": false
  },
  "message": "Review created successfully"
}
```
