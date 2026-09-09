# Admin Orders Analytics API

Base: `/api/admin/orders` (Admin only)

## GET `/analytics/status?days=30`

Returns order counts by status within the last `days` days (based on `orders.created_at`).

### Query

- `days` (number, optional): default `30`, max `365`.

### Response

```json
{
  "success": true,
  "data": {
    "from": "2026-04-01T00:00:00.000Z",
    "to": "2026-05-01T00:00:00.000Z",
    "days": 30,
    "total": 123,
    "counts": {
      "PENDING": 10,
      "CONFIRMED": 20,
      "PAID": 30,
      "SHIPPED": 15,
      "DELIVERED": 40,
      "CANCELLED": 6,
      "RETURNED": 2
    },
    "updatedAt": "2026-05-01T12:00:00.000Z"
  },
  "message": "OK",
  "timestamp": "2026-05-01T12:00:00.000Z"
}
```

## GET `/analytics/timeseries?days=30`

Returns a daily timeseries of total orders created within the last `days` days.

### Query

- `days` (number, optional): default `30`, max `365`.

### Response

```json
{
  "success": true,
  "data": {
    "from": "2026-04-01T00:00:00.000Z",
    "to": "2026-05-01T00:00:00.000Z",
    "days": 30,
    "points": [
      { "date": "2026-04-01", "total": 3 },
      { "date": "2026-04-02", "total": 5 }
    ],
    "updatedAt": "2026-05-01T12:00:00.000Z"
  },
  "message": "OK",
  "timestamp": "2026-05-01T12:00:00.000Z"
}
```
