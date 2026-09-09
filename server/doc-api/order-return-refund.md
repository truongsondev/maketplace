# Order Return/Refund API

## Client: Request Return/Refund

`POST /api/orders/:orderId/return`

Requires authenticated customer session.

Body:

```json
{
  "reasonCode": "WRONG_MODEL",
  "reason": "Áo nhận được khác mẫu trên hình",
  "evidenceImages": [
    {
      "url": "https://res.cloudinary.com/.../image/upload/returns/demo.jpg",
      "publicId": "returns/user/order/demo"
    }
  ],
  "bankAccountName": "Nguyen Van A",
  "bankAccountNumber": "0123456789",
  "bankName": "Vietcombank"
}
```

Allowed `reasonCode` values:

- `WRONG_MODEL`: Không đúng mẫu
- `WRONG_SIZE`: Không vừa, muốn đổi size
- `DEFECTIVE`: Hàng bị lỗi

Rules:

- Order must belong to current user.
- Order status must be `DELIVERED`.
- At least one evidence image is required.
- Bank account name, number, and bank name are required.

Response:

```json
{
  "success": true,
  "data": {
    "id": "order-id",
    "status": "DELIVERED",
    "returnStatus": "REQUESTED"
  },
  "message": "Return requested"
}
```

## Admin: Approve Return

`POST /api/admin/orders/:orderId/returns/approve`

Sets item returns from `RT_REQUESTED` to `RT_APPROVED` and order `returnStatus` to `APPROVED`.

## Admin: Reject Return

`POST /api/admin/orders/:orderId/returns/reject`

Sets item returns from `RT_REQUESTED` to `RT_REJECTED` and order `returnStatus` to `REJECTED`.

## Mock: Shipper Picked Up Return

`POST /api/mock/orders/:orderId/returns/pickup`

No auth required. Intended for Postman/local testing.

Sets order `returnStatus` from `APPROVED` to `SHIPPING` and item returns from `RT_APPROVED` to `RT_SHIPPING`.

## Mock: Admin Completed Returned Goods

`POST /api/mock/orders/:orderId/returns/complete`

No auth required. Intended for Postman/local testing.

Sets order `returnStatus` from `SHIPPING` to `COMPLETED` and item returns from `RT_APPROVED`/`RT_SHIPPING` to `RT_COMPLETED`.

## Admin Order List Payload

`GET /api/admin/orders`

Each order includes:

```json
{
  "returnStatus": "REQUESTED",
  "returns": {
    "requested": 1,
    "approved": 0,
    "shipping": 0,
    "rejected": 0,
    "completed": 0,
    "details": [
      {
        "id": "return-id",
        "orderItemId": "order-item-id",
        "status": "RT_REQUESTED",
        "reasonCode": "DEFECTIVE",
        "reason": "Đường may bị lỗi",
        "evidenceImages": [{ "url": "https://..." }],
        "bankAccountName": "Nguyen Van A",
        "bankAccountNumber": "0123456789",
        "bankName": "Vietcombank",
        "createdAt": "2026-04-29T00:00:00.000Z"
      }
    ]
  }
}
```

## Migration

Migration: `20260429123000_add_return_request_details`

Adds nullable columns to `returns`:

- `reason_code`
- `evidence_images`
- `bank_account_name`
- `bank_account_number`
- `bank_name`

Rollback:

```sql
DROP INDEX `returns_reason_code_idx` ON `returns`;
ALTER TABLE `returns`
  DROP COLUMN `reason_code`,
  DROP COLUMN `evidence_images`,
  DROP COLUMN `bank_account_name`,
  DROP COLUMN `bank_account_number`,
  DROP COLUMN `bank_name`;
```

Migration: `20260429131500_prefix_return_status_and_trim_flow`

- Renames `returns.status` values from `REQUESTED/APPROVED/REJECTED/COMPLETED` to `RT_REQUESTED/RT_APPROVED/RT_REJECTED/RT_COMPLETED`.
- Adds `RT_SHIPPING` for the shipper pickup stage.
- Removes legacy order flow values `WAITING_PICKUP` and `RETURNING` by mapping them to `APPROVED` and `SHIPPING`.

Rollback:

```sql
ALTER TABLE `orders`
  MODIFY `return_status` ENUM('REQUESTED', 'APPROVED', 'WAITING_PICKUP', 'SHIPPING', 'RETURNING', 'COMPLETED', 'REJECTED') NULL;

ALTER TABLE `returns`
  MODIFY `status` ENUM('REQUESTED', 'APPROVED', 'REJECTED', 'COMPLETED', 'RT_REQUESTED', 'RT_APPROVED', 'RT_SHIPPING', 'RT_COMPLETED', 'RT_REJECTED') NOT NULL DEFAULT 'RT_REQUESTED';

UPDATE `returns`
SET `status` = CASE `status`
  WHEN 'RT_REQUESTED' THEN 'REQUESTED'
  WHEN 'RT_APPROVED' THEN 'APPROVED'
  WHEN 'RT_REJECTED' THEN 'REJECTED'
  WHEN 'RT_COMPLETED' THEN 'COMPLETED'
  WHEN 'RT_SHIPPING' THEN 'APPROVED'
  ELSE `status`
END;

ALTER TABLE `returns`
  MODIFY `status` ENUM('REQUESTED', 'APPROVED', 'REJECTED', 'COMPLETED') NOT NULL DEFAULT 'REQUESTED';
```
