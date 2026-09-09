# Home Page APIs

Tai lieu nay mo ta cac API backend phuc vu man hinh Home Page, bao gom categories, new arrivals, category showcases va cart summary.

## 1) Get Featured Categories

- Method: GET
- URL: /api/products/categories/stats
- Auth: Khong bat buoc
- Cache: Co (Redis), TTL mac dinh 600 giay

### Query params

- non_empty_only: boolean, mac dinh false

### Example request

GET /api/products/categories/stats?non_empty_only=true

### Success response (200)

{
  "success": true,
  "message": "Category stats retrieved successfully",
  "data": [
    {
      "id": "cat-uuid",
      "name": "Ao Thun",
      "slug": "ao-thun",
      "imageUrl": "https://cdn.example.com/cat1.jpg",
      "productCount": 150
    }
  ]
}

## 2) Get New Arrivals / Product List

- Method: GET
- URL: /api/products
- Auth: Khong bat buoc

### Query params

- page: so nguyen duong, mac dinh 1
- limit: so nguyen duong, mac dinh 10, toi da 100
- sort: format field:order, hien tai ho tro createdAt:asc|desc (mac dinh createdAt:desc)
- c: category slug hoac id
- s: size
- cl: color
- p: khoang gia theo format min-max, min-, -max

### Example request

GET /api/products?sort=createdAt:desc&limit=12

### Success response (200)

{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "products": [
      {
        "id": "prod-uuid",
        "name": "Ao Thun Basic",
        "slug": "",
        "imageUrl": "https://cdn.example.com/p1.jpg",
        "minPrice": 250000,
        "isNew": true,
        "isSale": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 100,
      "totalPages": 9
    }
  }
}

## 3) Get Category Showcases

- Method: GET
- URL:
  - /api/products/category-showcases
  - /api/products/home/category-showcases (alias)
- Auth: Khong bat buoc
- Cache: Co (Redis), TTL mac dinh 600 giay

### Query params

- categoryLimit: so nguyen duong, toi da 10, mac dinh 4
- productLimit: so nguyen duong, toi da 20, mac dinh 3

### Example request

GET /api/products/category-showcases?categoryLimit=4&productLimit=3

### Success response (200)

{
  "success": true,
  "message": "Category showcases retrieved successfully",
  "data": [
    {
      "id": "cat-uuid",
      "name": "Ao Khoac",
      "slug": "ao-khoac",
      "products": [
        {
          "id": "prod-1",
          "name": "Jacket",
          "imageUrl": "https://cdn.example.com/jacket.jpg",
          "minPrice": 500000,
          "isNew": true,
          "isSale": true
        }
      ]
    }
  ]
}

### Error cases

- 400 Bad Request
  - categoryLimit must be less than or equal to 10
  - productLimit must be less than or equal to 20

## 4) Get Cart Summary

- Method: GET
- URL: /api/cart/summary
- Auth: Bat buoc Bearer access token

### Success response (200)

{
  "success": true,
  "message": "Cart summary retrieved successfully",
  "data": {
    "totalItems": 3,
    "totalPrice": 750000
  }
}

### Error cases

- 401 Unauthorized
  - Missing or malformed Authorization header
  - Token invalid/expired

## Database and migration notes

### Migration

- Ten migration: 20260403130000_add_product_homepage_flags
- Tac dong:
  - Add column products.is_new (BOOLEAN, default false)
  - Add column products.is_sale (BOOLEAN, default false)
  - Add index products_created_at_idx

### Rollback

Neu can rollback migration nay (chi dung cho moi truong dev/staging):

1. Mark migration as rolled back:
   - prisma migrate resolve --rolled-back 20260403130000_add_product_homepage_flags
2. Revert schema + SQL migration file trong source code.
3. Re-deploy migrations.

Hoac rollback SQL thu cong:

ALTER TABLE `products`
  DROP COLUMN `is_new`,
  DROP COLUMN `is_sale`;

DROP INDEX `products_created_at_idx` ON `products`;

## Business/behavior notes

- Favorites add/remove da idempotent do unique constraint (user_id, product_id).
- Category showcases truy van theo category -> products trong 1 query include, tranh N+1 o frontend.
- Cart summary toi uu cho header badge, tra tong so luong va tong gia tri.
