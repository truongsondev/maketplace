# Export Products API

## Endpoint

```
GET http://localhost:8080/api/admin/products/export
```

## Query Parameters

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search keyword
- `categoryId` (optional): Filter by category ID
- `status` (optional): Filter by status (active, inactive, deleted)
- `minPrice` (optional): Minimum price filter
- `maxPrice` (optional): Maximum price filter
- `stockStatus` (optional): Stock status filter (all, low, out)
- `tagIds` (optional): Comma-separated tag IDs
- `sortBy` (optional): Sort field (name, basePrice, createdAt, totalStock)
- `sortOrder` (optional): Sort direction (asc, desc)

## Example Requests

### 1. Export all active products

```bash
GET http://localhost:8080/api/admin/products/export?status=active
```

### 2. Export with sorting

```bash
GET http://localhost:8080/api/admin/products/export?page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

### 3. Export with filters

```bash
GET http://localhost:8080/api/admin/products/export?status=active&minPrice=100000&maxPrice=1000000
```

### 4. Export with search

```bash
GET http://localhost:8080/api/admin/products/export?search=iPhone&sortBy=name&sortOrder=asc
```

## Response

- Content-Type: `text/csv; charset=utf-8`
- Content-Disposition: `attachment; filename="products-2026-03-11.csv"`

## CSV Format

```csv
ID,Name,Base Price,Total Stock,Categories,Tags,Status,Created At
prod-uuid-1,"iPhone 15 Pro Max",29990000,450,"Điện thoại|Apple","Hot Deal|Flagship",active,2026-03-01T10:00:00.000Z
prod-uuid-2,"Samsung S24 Ultra",27990000,380,"Điện thoại|Samsung","Sale|New",active,2026-03-05T14:20:00.000Z
```

## cURL Example

```bash
curl -X GET "http://localhost:8080/api/admin/products/export?page=1&limit=20&sortBy=createdAt&sortOrder=desc" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -o products.csv
```

## Notes

- The export automatically limits to 10,000 products to prevent memory issues
- Multiple categories and tags are separated by pipe (|) character
- Double quotes in values are escaped by doubling them ("")
- The filename includes the current date (YYYY-MM-DD format)
