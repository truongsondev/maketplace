# Admin Notification API (Payment Success + Low Stock)

## Overview

Tai lieu nay mo ta cac API va realtime event cho chuc nang thong bao admin khi user thanh toan thanh cong va khi ton kho bien the cham nguong canh bao.

Base URL backend: `/api`

## 1) List notifications

- Method: `GET`
- URL: `/admin/notifications`
- Auth: `Bearer accessToken` (ADMIN)
- Query:
  - `page` (optional, default `1`)
  - `limit` (optional, default `20`, max `100`)

### Response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "content": "Don hang #123456 da thanh toan thanh cong (500000 VND)",
        "isRead": false,
        "createdAt": "2026-04-19T10:00:00.000Z"
      }
    ],
    "total": 12,
    "page": 1,
    "limit": 20,
    "unreadCount": 3
  }
}
```

## 2) Mark one as read

- Method: `PATCH`
- URL: `/admin/notifications/:id/read`
- Auth: `Bearer accessToken` (ADMIN)

### Response

```json
{
  "success": true,
  "data": {
    "updated": true
  }
}
```

## 3) Mark all as read

- Method: `PATCH`
- URL: `/admin/notifications/read-all`
- Auth: `Bearer accessToken` (ADMIN)

### Response

```json
{
  "success": true,
  "data": {
    "updatedCount": 5
  }
}
```

## 4) Realtime stream (SSE)

- Method: `GET`
- URL: `/admin/notifications/stream?token=<accessToken>`
- Auth: query token (EventSource khong gui Authorization header)
- Content-Type: `text/event-stream`

### Event: `connected`

```text
event: connected
data: {"connectedAt":"2026-04-19T10:00:00.000Z"}
```

### Event: `payment_success`

```text
event: payment_success
data: {"id":"uuid","content":"Don hang #123456 da thanh toan thanh cong (500000 VND)","isRead":false,"createdAt":"2026-04-19T10:00:00.000Z"}
```

### Event: `low_stock`

```text
event: low_stock
data: {"id":"uuid","content":"Canh bao ton kho thap: Ao khoac AURA (SKU: AURA-AK-M-BLACK) con 3, nguong canh bao 5","isRead":false,"createdAt":"2026-04-20T08:30:00.000Z"}
```

### Event: `cancel_request`

```text
event: cancel_request
data: {"id":"uuid","content":"Yeu cau huy don hang #123456 da duoc gui. Ly do: Mua san pham khac","isRead":false,"createdAt":"2026-04-20T09:15:00.000Z"}
```

## Frontend integration note

- Client mo stream bang `new EventSource(`${API_BASE_URL}/api/admin/notifications/stream?token=${accessToken}`)`.
- Lang nghe event `payment_success` va `low_stock`.
- Khi nhan event:
  - them item vao dau list cache,
  - tang `unreadCount`,
  - hien toast.

## Reliability & idempotency

- Webhook duplicate khong tao duplicate event vi backend chi update `PENDING -> PAID` mot lan.
- RabbitMQ consumer co dedupe key theo `orderId` de tranh tao thong bao trung khi redelivery.
- Neu RabbitMQ publish loi, backend fallback xu ly truc tiep de khong block webhook flow.
- Low-stock chi phat thong bao khi ton kho vua cat qua nguong (`stockOnHand` tu lon hon `minStock` xuong nho hon hoac bang `minStock`) va co dedupe key theo `variantId + stockOnHand` de tranh spam.
- Cancel-request thong bao admin chi duoc tao khi yeu cau chuyen sang trang thai `REQUESTED` tu trang thai khac, de tranh spam khi nguoi dung submit lai cung mot yeu cau.
