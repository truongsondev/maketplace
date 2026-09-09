# Banner APIs

## Admin APIs

### GET /api/admin/banners

Query:

- page: number (default 1)
- limit: number (default 20, max 100)
- search: string (optional)
- isActive: boolean (optional)

Response:

- items: Banner[]
- pagination: { page, limit, total, totalPages }

### GET /api/admin/banners/:id

Response:

- Banner detail

### POST /api/admin/banners

Body:

- title: string (required)
- subtitle: string | null
- description: string | null
- imageUrl: string (required)
- isActive: boolean (optional, default false)
- sortOrder: integer (optional, default 0)

### PUT /api/admin/banners/:id

Body: same as create

### PATCH /api/admin/banners/:id/status

Body:

- isActive: boolean

### POST /api/admin/banners/cloudinary/sign

Body:

- folder: string (optional, default banners)

Returns Cloudinary signature payload for client-side upload.

## Public API

### GET /api/common/banners/active

Response:

- items: active banners sorted by sortOrder asc then createdAt desc
