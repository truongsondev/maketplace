# Admin Users Analytics API

Base: `/api/admin/users` (Admin only)

## GET `/analytics/customer-cohorts?days=30`

Counts **new vs returning customers** within the last `days` days.

Definitions (based on paid orders):

- Customer: a user with at least one payment where `payments.status` in `PAID|SUCCESS`.
- New customer: first paid order is within the time range.
- Returning customer: has a paid order in the time range and the first paid order is before the range.

### Query

- `days` (number, optional): default `30`, max `365`.

### Response

```json
{
  "success": true,
  "data": {
    "from": "2026-03-17T00:00:00.000Z",
    "to": "2026-04-16T00:00:00.000Z",
    "days": 30,
    "customersWithOrders": 19,
    "newCustomers": 7,
    "returningCustomers": 12,
    "updatedAt": "2026-04-15T12:00:00.000Z"
  },
  "message": "OK",
  "timestamp": "2026-04-15T12:00:00.000Z"
}
```

## GET `/analytics/top-spenders?days=30&limit=10`

Returns top customers by total spending within the last `days` days (sum of `orders.total_price` for paid orders).

### Query

- `days` (number, optional): default `30`, max `365`.
- `limit` (number, optional): default `10`, max `50`.

### Response

```json
{
  "success": true,
  "data": {
    "from": "2026-03-17T00:00:00.000Z",
    "to": "2026-04-16T00:00:00.000Z",
    "days": 30,
    "limit": 10,
    "items": [
      {
        "userId": "...",
        "email": "buyer@example.com",
        "phone": null,
        "totalSpent": 1250000,
        "ordersCount": 3,
        "lastPaidAt": "2026-04-10T08:01:00.000Z"
      }
    ],
    "updatedAt": "2026-04-15T12:00:00.000Z"
  },
  "message": "OK",
  "timestamp": "2026-04-15T12:00:00.000Z"
}
```
