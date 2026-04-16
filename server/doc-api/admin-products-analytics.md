# Admin Products Analytics

Base URL: `http://localhost:8080/api/admin`

All endpoints require admin authentication.

## GET /products/analytics/top-selling

Return top selling products in the last N days.

Query params:

- `days` (number, optional, default: 30)
- `limit` (number, optional, default: 5)

Response (success):

```json
{
  "success": true,
  "data": {
    "from": "2026-03-16T00:00:00.000Z",
    "to": "2026-04-15T00:00:00.000Z",
    "days": 30,
    "limit": 5,
    "items": [
      {
        "productId": "...",
        "name": "Product A",
        "imageUrl": "https://...",
        "quantitySold": 123,
        "ordersCount": 45
      }
    ],
    "updatedAt": "2026-04-15T12:34:56.000Z"
  },
  "message": "OK",
  "timestamp": "2026-04-15T12:34:56.000Z"
}
```

## GET /products/analytics/top-favorited

Return top favorited products (wishlist) in the last N days.

Query params:

- `days` (number, optional, default: 30)
- `limit` (number, optional, default: 5)

Response (success):

```json
{
  "success": true,
  "data": {
    "from": "2026-03-16T00:00:00.000Z",
    "to": "2026-04-15T00:00:00.000Z",
    "days": 30,
    "limit": 5,
    "items": [
      {
        "productId": "...",
        "name": "Product B",
        "imageUrl": "https://...",
        "favoritesCount": 99
      }
    ],
    "updatedAt": "2026-04-15T12:34:56.000Z"
  },
  "message": "OK",
  "timestamp": "2026-04-15T12:34:56.000Z"
}
```

## GET /products/analytics/least-bought

Return least bought products (by sold quantity) in the last N days.

Query params:

- `days` (number, optional, default: 30)
- `limit` (number, optional, default: 5)

Response (success):

```json
{
  "success": true,
  "data": {
    "from": "2026-03-16T00:00:00.000Z",
    "to": "2026-04-15T00:00:00.000Z",
    "days": 30,
    "limit": 5,
    "items": [
      {
        "productId": "...",
        "name": "Product C",
        "imageUrl": null,
        "quantitySold": 0
      }
    ],
    "updatedAt": "2026-04-15T12:34:56.000Z"
  },
  "message": "OK",
  "timestamp": "2026-04-15T12:34:56.000Z"
}
```
