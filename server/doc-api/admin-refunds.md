# ADMIN REFUNDS API

## Base URL

`/api/admin/refunds`

## Authentication

- Bearer token bat buoc
- Role: `ADMIN`

## 1) GET /api/admin/refunds

Lay danh sach giao dich hoan tien.

### Query params

- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)
- `search` (string): tim theo refundId, orderId, email, orderCode
- `status` (`PENDING` | `SUCCESS` | `FAILED` | `RETRYING`)
- `type` (`CANCEL_REFUND` | `RETURN_REFUND`)
- `sortBy` (`requestedAt` | `processedAt` | `amount`)
- `sortOrder` (`asc` | `desc`)

### Response

```json
{
  "success": true,
  "message": "Refunds fetched successfully",
  "data": {
    "items": [
      {
        "id": "rf_123",
        "orderId": "ord_123",
        "orderStatus": "CANCELLED",
        "type": "CANCEL_REFUND",
        "status": "PENDING",
        "amount": "250000.00",
        "currency": "VND",
        "provider": null,
        "providerRefundId": null,
        "retryCount": 0,
        "failureReason": null,
        "requestedAt": "2026-04-09T09:00:00.000Z",
        "processedAt": null,
        "initiatedBy": "USER",
        "user": {
          "id": "user_1",
          "email": "buyer@example.com",
          "phone": null
        },
        "payment": {
          "status": "SUCCESS",
          "method": "PAYOS",
          "orderCode": "202604090001"
        }
      }
    ],
    "aggregations": {
      "pending": 10,
      "success": 5,
      "failed": 2,
      "retrying": 1
    },
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 18,
      "totalPages": 1
    }
  }
}
```

## 2) GET /api/admin/refunds/:id

Lay chi tiet 1 refund transaction.

### Response

```json
{
  "success": true,
  "message": "Refund fetched successfully",
  "data": {
    "id": "rf_123",
    "orderId": "ord_123",
    "idempotencyKey": "cancel-ord_123",
    "reason": "Buyer requested order cancellation"
  }
}
```

## 3) POST /api/admin/refunds/:id/retry

Retry xu ly hoan tien that bai/dang retry. Hien tai flow MVP xu ly manual va set thanh cong.

### Response

```json
{
  "success": true,
  "message": "Refund retried successfully",
  "data": {
    "id": "rf_123",
    "status": "SUCCESS",
    "provider": "MANUAL",
    "providerRefundId": "manual-rf_123-1712660000000"
  }
}
```

## Error cases

- `400`: request khong hop le (status/type sai, id thieu)
- `401`: chua dang nhap
- `403`: khong co role admin
- `404`: refund khong ton tai
