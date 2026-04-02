# Product Favorites API

Tai lieu cho cac endpoint san pham yeu thich, tap trung vao endpoint lay danh sach favorites.

## 1) Get all favorite products

- Method: GET
- URL: /api/products/favorites
- Auth: Bat buoc Bearer access token

### Query params

- page: so trang, so nguyen duong, mac dinh 1
- limit: so ban ghi moi trang, so nguyen duong, mac dinh 10, toi da 100

### Example request

GET /api/products/favorites?page=1&limit=20
Authorization: Bearer <access_token>

### Success response (200)

{
  "success": true,
  "message": "Favorite products retrieved successfully",
  "data": {
    "products": [
      {
        "productId": "c1d2e3f4-1111-2222-3333-444455556666",
        "name": "Sneaker Alpha",
        "slug": "sneaker-alpha",
        "imageUrl": "https://res.cloudinary.com/example/image/upload/p1.jpg",
        "minPrice": 199000,
        "favoritedAt": "2026-04-01T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 37,
      "totalPages": 2
    }
  }
}

### Error cases

- 401 Unauthorized
  - Missing or malformed Authorization header
  - Token invalid/expired
- 400 Bad Request
  - page must be a positive integer
  - limit must be a positive integer
  - limit must be less than or equal to 100

### Business rules

- Chi tra ve san pham chua bi soft-delete.
- Sap xep theo thoi diem yeu thich moi nhat truoc (favoritedAt desc).
- Tranh N+1 query: repository su dung findMany + include product/variant/image trong 1 truy van.

## 2) Add product to favorites

- Method: POST
- URL: /api/products/:id/favorite
- Auth: Bat buoc Bearer access token
- Idempotent: Co. Neu da yeu thich truoc do, he thong khong tao ban ghi trung.

## 3) Remove product from favorites

- Method: DELETE
- URL: /api/products/:id/favorite
- Auth: Bat buoc Bearer access token
- Idempotent: Co. Xoa nhieu lan cho cung 1 product van tra ket qua thanh cong theo logic hien tai.

## Database notes

- Bang wishlists co unique constraint (user_id, product_id) de dam bao khong trung du lieu.
- Nen giu index product_id de toi uu join/loc du lieu.
