# Voucher API

## 1. Public/User APIs

### GET /api/vouchers/active

- Auth: Required
- Description: Lay danh sach voucher dang active de hien thi banner/home/product.
- Response:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "...",
        "code": "WELCOME10",
        "description": "Giam 10% toi da 20k",
        "type": "PERCENTAGE",
        "value": 10,
        "maxDiscount": 20000,
        "minOrderAmount": 100000,
        "maxUsage": 100,
        "userUsageLimit": 1,
        "usedCount": 0,
        "startAt": "2026-04-07T02:00:00.000Z",
        "endAt": "2026-04-30T17:00:00.000Z",
        "isActive": true,
        "bannerImageUrl": "https://res.cloudinary.com/..."
      }
    ]
  }
}
```

### POST /api/vouchers/validate

- Auth: Required
- Description: Validate voucher theo gio hang hien tai.
- Body:

```json
{
  "code": "WELCOME10",
  "cartItemIds": ["cartItemId1", "cartItemId2"]
}
```

- Response:

```json
{
  "success": true,
  "data": {
    "voucher": {
      "id": "...",
      "code": "WELCOME10",
      "type": "PERCENTAGE"
    },
    "pricing": {
      "subtotal": 250000,
      "discountAmount": 20000,
      "finalTotal": 230000
    }
  }
}
```

### POST /api/vouchers/apply

- Auth: Required
- Description: Apply voucher tại trang /cart (tính giảm giá theo giỏ hàng hiện tại).
- Body: giống `/api/vouchers/validate`
- Response: giống `/api/vouchers/validate`

## 2. Admin Voucher APIs

### GET /api/admin/vouchers?page=1&limit=20&search=&isActive=true

- Auth: Admin
- Description: Danh sach voucher cho trang quan tri.

### GET /api/admin/vouchers/:id

- Auth: Admin
- Description: Chi tiet voucher.

### POST /api/admin/vouchers

- Auth: Admin
- Description: Tao voucher.
- Body:

```json
{
  "code": "WELCOME10",
  "description": "Giam 10% cho don tu 100k",
  "type": "PERCENTAGE",
  "value": 10,
  "maxDiscount": 20000,
  "minOrderAmount": 100000,
  "maxUsage": 100,
  "userUsageLimit": 1,
  "startAt": "2026-04-07T02:00:00.000Z",
  "endAt": "2026-04-30T17:00:00.000Z",
  "isActive": true,
  "bannerImageUrl": "https://res.cloudinary.com/..."
}
```

### PUT /api/admin/vouchers/:id

- Auth: Admin
- Description: Cap nhat voucher (payload giong POST).

### PATCH /api/admin/vouchers/:id/status

- Auth: Admin
- Description: Bat/tat voucher.
- Body:

```json
{
  "isActive": false
}
```

## 3. Checkout Integration

### POST /api/payments/payos/create-link

- Auth: Required
- New request fields:

```json
{
  "amount": 230000,
  "description": "TT 2 san pham",
  "cartItemIds": ["cartItemId1", "cartItemId2"],
  "voucherCode": "WELCOME10"
}
```

- Backend behavior:

1. Tu tinh subtotal theo cartItemIds.
2. Validate voucher theo business rules.
3. Recompute final payable amount.
4. Reject neu amount FE gui len khac amount BE tinh.
5. Save discountId/discountAmount vao order.
6. Khi webhook PayOS tra PAID: tao discount_usage va tang used_count.
