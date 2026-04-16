# Admin Dashboard API

## Base URL

`/api/admin/dashboard`

## Authentication

- Header: `Authorization: Bearer <access_token>`
- Role: `ADMIN`

## Data rules

- Revenue is computed from `payments` where `status IN (PAID, SUCCESS)` and `paidAt` is within range.
- Orders count is the number of successful payments in range.
- Items sold is the sum of `order_items.quantity` for orders whose payment is successful in range.
- Profit is `null` because the current schema does not store product cost.

## 1) GET /api/admin/dashboard/overview

Overview KPI cards (today / month / year).

### Response

```json
{
  "success": true,
  "data": {
    "revenue": { "currency": "VND", "today": 1200000, "month": 54000000, "year": 120000000 },
    "orders": { "today": 12, "month": 1842, "year": 9650 },
    "itemsSold": { "today": 34, "month": 4260, "year": 25800 },
    "profit": null,
    "updatedAt": "2026-04-15T04:00:00.000Z"
  },
  "message": "Dashboard overview fetched successfully",
  "timestamp": "2026-04-15T04:00:00.000Z"
}
```

## 2) GET /api/admin/dashboard/timeseries

Timeseries for charts (daily aggregation).

### Query

- `days?: number` (default: 30, max: 90)

### Response

```json
{
  "success": true,
  "data": {
    "from": "2026-03-17T00:00:00.000Z",
    "to": "2026-04-16T00:00:00.000Z",
    "days": 30,
    "points": [
      { "date": "2026-04-14", "revenue": 1200000, "orders": 12, "itemsSold": 34 },
      { "date": "2026-04-15", "revenue": 800000, "orders": 7, "itemsSold": 20 }
    ],
    "updatedAt": "2026-04-15T04:00:00.000Z"
  },
  "message": "Dashboard timeseries fetched successfully",
  "timestamp": "2026-04-15T04:00:00.000Z"
}
```

## 3) GET /api/admin/dashboard/recent-orders

Recent orders list for dashboard.

### Query

- `limit?: number` (default: 5, max: 20)

### Response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "orderCode": "123456",
        "createdAt": "2026-04-15T03:50:00.000Z",
        "status": "DELIVERED",
        "totalPrice": 1200000,
        "customerEmail": "buyer@example.com",
        "paymentMethod": "PAYOS",
        "paymentStatus": "PAID"
      }
    ]
  },
  "message": "Recent orders fetched successfully",
  "timestamp": "2026-04-15T04:00:00.000Z"
}
```
