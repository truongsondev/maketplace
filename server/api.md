# API SPECIFICATION FOR PRODUCT MANAGEMENT SYSTEM (ADMIN)

---

# 0. ADMIN AUTH API

## **POST /api/admin/auth/login**

Dang nhap danh rieng cho admin. Endpoint nay public (khong can Bearer token),
nhung chi cap token khi user hop le va co role ADMIN.

### Request Body

```json
{
  "email": "admin@example.com",
  "password": "123456"
}
```

### Response Thanh Cong (200)

```json
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "token": {
      "accessToken": "atk_xxx",
      "refreshToken": "rtk_xxx"
    },
    "user": {
      "id": "user-uuid",
      "email": "admin@example.com",
      "fullName": "Admin User",
      "avatarUrl": "https://cdn.example.com/avatar.jpg",
      "roles": ["ADMIN"]
    }
  }
}
```

### Response Loi Thuong Gap

- 400 Bad Request: email/password khong hop le
- 401 Unauthorized: sai thong tin dang nhap hoac khong co role ADMIN
- 429 Too Many Requests: vuot gioi han tan suat

### Tai lieu chi tiet

- Xem file: `doc-api/admin-auth-login.md`
- Request test nhanh: `doc-api/admin-auth-login.http`

---

# 0.1 ADMIN USERS API

Tai lieu chi tiet cho module quan ly users:

- Xem file: `doc-api/admin-users.md`
- Request test nhanh: `doc-api/admin-users.http`

---

# 0.2 ADMIN REFUNDS API

Tai lieu chi tiet cho module quan ly refund:

- Xem file: `doc-api/admin-refunds.md`
- Request test nhanh: `doc-api/admin-refunds.http`

---

## BASE URL

```
/api/admin/products
```

---

## AUTHENTICATION

Tất cả endpoints yêu cầu:

- Header: `Authorization: Bearer <access_token>`
- Role: `ADMIN`

---

# 1. PRODUCT LIST API

## **GET /api/admin/products**

Lấy danh sách sản phẩm với filters, search, pagination.

### Request Query Parameters

```typescript
{
  // Pagination
  page?: number;              // Default: 1
  limit?: number;             // Default: 20, Max: 100

  // Search
  search?: string;            // Fulltext search: name, SKU, tags

  // Filters
  categoryId?: string;        // Filter by category (include sub-categories)
  status?: 'active' | 'inactive' | 'deleted'; // Default: 'active'
  minPrice?: number;
  maxPrice?: number;
  stockStatus?: 'all' | 'low' | 'out'; // low = có variant < minStock
  tagIds?: string;            // Comma-separated: "uuid1,uuid2"

  // Sorting
  sortBy?: 'name' | 'basePrice' | 'createdAt' | 'totalStock';
  sortOrder?: 'asc' | 'desc'; // Default: 'desc'
}
```

### Response

```typescript
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "prod-uuid-1",
        "name": "iPhone 15 Pro Max",
        "basePrice": 29990000,
        "status": "active",        // active | inactive | deleted
        "createdAt": "2026-03-01T10:00:00Z",
        "updatedAt": "2026-03-10T15:30:00Z",

        // Primary image
        "primaryImage": {
          "id": "img-uuid",
          "url": "https://cdn.example.com/iphone-15.jpg",
          "altText": "iPhone 15 Pro Max"
        },

        // Variants summary
        "variantsSummary": {
          "count": 8,
          "firstSku": "IP15-PM-256-BLU",
          "priceRange": {
            "min": 29990000,
            "max": 39990000
          },
          "totalStock": 450,
          "lowStockCount": 2  // Số variants có stock < minStock
        },

        // Categories (first 3, có parentId để build breadcrumb)
        "categories": [
          {
            "id": "cat-uuid-1",
            "name": "Điện thoại",
            "slug": "dien-thoai",
            "parentId": "cat-electronics"
          }
        ],

        // Tags (first 5)
        "tags": [
          {
            "id": "tag-uuid-1",
            "name": "Hot Deal",
            "slug": "hot-deal"
          }
        ]
      }
    ],

    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1250,
      "totalPages": 63
    },

    // Aggregations for UI filters
    "aggregations": {
      "statusCount": {
        "active": 1100,
        "inactive": 100,
        "deleted": 50
      },
      "stockStatus": {
        "all": 1250,
        "low": 45,
        "out": 12
      }
    }
  }
}
```

---

# 2. PRODUCT DETAIL API

## **GET /api/admin/products/:id**

Lấy chi tiết đầy đủ 1 sản phẩm.

### Response

```typescript
{
  "success": true,
  "data": {
    // Basic info
    "id": "prod-uuid-1",
    "name": "iPhone 15 Pro Max",
    "description": "<p>Điện thoại cao cấp...</p>",
    "basePrice": 29990000,
    "status": "active",
    "createdAt": "2026-03-01T10:00:00Z",
    "updatedAt": "2026-03-10T15:30:00Z",

    // Full variants
    "variants": [
      {
        "id": "var-uuid-1",
        "sku": "IP15-PM-256-BLU",
        "attributes": {
          "storage": "256GB",
          "color": "Blue Titanium",
          "colorCode": "#4A5568"
        },
        "price": 29990000,
        "stockAvailable": 50,
        "stockReserved": 5,
        "minStock": 10,
        "status": "active",
        "createdAt": "2026-03-01T10:00:00Z",

        // Images riêng của variant này
        "images": [
          {
            "id": "img-var-uuid-1",
            "url": "https://cdn.example.com/ip15-blue-256.jpg",
            "altText": "iPhone 15 Pro Max Blue 256GB",
            "sortOrder": 0,
            "isPrimary": true
          }
        ]
      }
    ],

    // All images (không gán variant - ảnh chung)
    "images": [
      {
        "id": "img-uuid-1",
        "url": "https://cdn.example.com/iphone-15-main.jpg",
        "altText": "iPhone 15 Pro Max",
        "sortOrder": 0,
        "isPrimary": true,
        "variantId": null  // null = ảnh chung
      }
    ],

    // Full categories (có parent để build tree)
    "categories": [
      {
        "id": "cat-uuid-1",
        "name": "Điện thoại",
        "slug": "dien-thoai",
        "parentId": "cat-electronics",
        "parent": {
          "id": "cat-electronics",
          "name": "Điện tử",
          "slug": "dien-tu"
        }
      }
    ],

    // Full tags
    "tags": [
      {
        "id": "tag-uuid-1",
        "name": "Hot Deal",
        "slug": "hot-deal"
      }
    ],

    // Stats for UI
    "stats": {
      "totalVariants": 8,
      "totalStock": 450,
      "lowStockVariants": 2,
      "totalImages": 12
    }
  }
}
```

---

# 3. CREATE PRODUCT API

## **POST /api/admin/products**

Tạo sản phẩm mới với variants, images, categories, tags.

### Request Body

```typescript
{
  // Basic info
  "name": "Samsung Galaxy S24 Ultra",
  "description": "<p>Flagship mới nhất...</p>",
  "basePrice": 27990000,
  "status": "active",  // active | inactive

  // Categories
  "categoryIds": ["cat-uuid-1", "cat-uuid-2"],

  // Tags
  "tagIds": ["tag-uuid-1", "tag-uuid-2"],

  // Variants (tối thiểu 1)
  "variants": [
    {
      "sku": "S24U-256-BLK",  // Must be unique
      "attributes": {
        "storage": "256GB",
        "color": "Titanium Black",
        "colorCode": "#1A202C"
      },
      "price": 27990000,
      "stockAvailable": 100,
      "minStock": 10
    }
  ],

  // Images không gán variant (ảnh chung)
  "images": [
    {
      "url": "https://cdn.example.com/s24-main.jpg",
      "altText": "Samsung Galaxy S24 Ultra",
      "sortOrder": 0,
      "isPrimary": true
    }
  ]
}
```

### Response

```typescript
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": "prod-uuid-new",
    // ... full product details như GET /:id
  }
}
```

### Validation Errors

```typescript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "name",
        "message": "Product name is required"
      },
      {
        "field": "variants[0].sku",
        "message": "SKU 'S24U-256-BLK' already exists"
      },
      {
        "field": "categoryIds[0]",
        "message": "Category with ID 'cat-invalid' not found"
      }
    ]
  }
}
```

---

# 4. UPDATE PRODUCT API

## **PUT /api/admin/products/:id**

Cập nhật toàn bộ thông tin sản phẩm.

### Request Body

```typescript
{
  // Giống POST nhưng có thể partial update
  "name": "Samsung Galaxy S24 Ultra (Updated)",
  "description": "<p>Mô tả mới...</p>",
  "basePrice": 26990000,
  "status": "active",

  "categoryIds": ["cat-uuid-1"],
  "tagIds": ["tag-uuid-1", "tag-uuid-3"],

  // Variants: Full replacement
  "variants": [
    {
      "id": "var-existing-uuid",  // Có id = update existing
      "sku": "S24U-256-BLK",
      "price": 26990000,
      "stockAvailable": 120
    },
    {
      // Không có id = create new
      "sku": "S24U-512-BLK",
      "attributes": {
        "storage": "512GB",
        "color": "Titanium Black"
      },
      "price": 31990000,
      "stockAvailable": 50,
      "minStock": 10
    }
  ],

  // Images: Full replacement
  "images": [
    {
      "id": "img-existing-uuid",  // Update
      "url": "https://cdn.example.com/updated.jpg",
      "altText": "Ảnh mới",
      "sortOrder": 0,
      "isPrimary": true
    },
    {
      // Create new
      "url": "https://cdn.example.com/new.jpg",
      "sortOrder": 1
    }
  ]
}
```

### Logic

- **Variants không gửi lên** = soft delete (set `status = 'deleted'`)
- **Images không gửi lên** = xóa khỏi DB
- **Price thay đổi** = tự động tạo record trong `ProductPriceHistory`
- **Categories/Tags** = xóa associations cũ, tạo mới

### Response

```typescript
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    // ... full product details
  }
}
```

---

# 5. DELETE PRODUCT API (SOFT DELETE)

## **DELETE /api/admin/products/:id**

Xóa mềm sản phẩm và tất cả variants.

### Response

```typescript
{
  "success": true,
  "message": "Product deleted successfully"
}
```

### Logic

- Set `Product.status = 'deleted'`
- Set tất cả `ProductVariant.status = 'deleted'`
- Không xóa khỏi DB

---

# 6. RESTORE PRODUCT API

## **POST /api/admin/products/:id/restore**

Khôi phục sản phẩm đã xóa.

### Response

```typescript
{
  "success": true,
  "message": "Product restored successfully",
  "data": {
    // ... full product details
  }
}
```

---

# 7. BULK ACTIONS

## **POST /api/admin/products/bulk-delete**

Xóa nhiều sản phẩm.

### Request

```typescript
{
  "productIds": ["prod-uuid-1", "prod-uuid-2", "prod-uuid-3"]
}
```

### Response

```typescript
{
  "success": true,
  "message": "3 products deleted successfully",
  "data": {
    "successCount": 3,
    "failedCount": 0,
    "failedIds": []
  }
}
```

---

## **POST /api/admin/products/bulk-assign-categories**

Gán danh mục hàng loạt.

### Request

```typescript
{
  "productIds": ["prod-uuid-1", "prod-uuid-2"],
  "categoryIds": ["cat-uuid-1", "cat-uuid-2"],
  "mode": "append"  // append = thêm vào | replace = thay thế hoàn toàn
}
```

### Response

```typescript
{
  "success": true,
  "message": "Categories assigned to 2 products successfully"
}
```

---

## **POST /api/admin/products/bulk-assign-tags**

Gán tags hàng loạt.

### Request

```typescript
{
  "productIds": ["prod-uuid-1", "prod-uuid-2"],
  "tagIds": ["tag-uuid-1", "tag-uuid-2"],
  "mode": "append"  // append | replace
}
```

### Response

```typescript
{
  "success": true,
  "message": "Tags assigned to 2 products successfully"
}
```

---

# 8. EXPORT PRODUCTS

## **GET /api/admin/products/export**

Export danh sách sản phẩm ra CSV.

### Query Parameters

Hỗ trợ cùng filters như `GET /products`.

### Response

```csv
Content-Type: text/csv
Content-Disposition: attachment; filename="products-2026-03-11.csv"

ID,Name,Base Price,Total Stock,Categories,Tags,Status,Created At
prod-uuid-1,"iPhone 15 Pro Max",29990000,450,"Điện thoại|Apple","Hot Deal|Flagship",active,2026-03-01T10:00:00Z
prod-uuid-2,"Samsung S24 Ultra",27990000,380,"Điện thoại|Samsung","Sale|New",active,2026-03-05T14:20:00Z
```

---

# 9. VARIANT MANAGEMENT

## **POST /api/admin/products/:productId/variants**

Thêm variant mới cho sản phẩm.

### Request

```typescript
{
  "sku": "IP15-PM-512-NAT",
  "attributes": {
    "storage": "512GB",
    "color": "Natural Titanium",
    "colorCode": "#E2E8F0"
  },
  "price": 34990000,
  "stockAvailable": 80,
  "minStock": 10
}
```

### Response

```typescript
{
  "success": true,
  "message": "Variant created successfully",
  "data": {
    "id": "var-uuid-new",
    "sku": "IP15-PM-512-NAT",
    // ... full variant details
  }
}
```

---

## **PUT /api/admin/variants/:id**

Cập nhật variant.

### Request

```typescript
{
  "sku": "IP15-PM-512-NAT-V2",
  "attributes": {
    "storage": "512GB",
    "color": "Natural Titanium",
    "material": "Titanium"
  },
  "price": 33990000,
  "stockAvailable": 90,
  "minStock": 15
}
```

### Response

```typescript
{
  "success": true,
  "message": "Variant updated successfully",
  "data": {
    // ... full variant details
  }
}
```

### Side Effects

- Price thay đổi → tạo `ProductPriceHistory`

---

## **DELETE /api/admin/variants/:id**

Xóa mềm variant.

### Response

```typescript
{
  "success": true,
  "message": "Variant deleted successfully"
}
```

### Validation

- Không cho xóa nếu product chỉ còn 1 variant active

```typescript
{
  "success": false,
  "error": {
    "code": "LAST_VARIANT",
    "message": "Cannot delete the last active variant. Product must have at least one variant."
  }
}
```

---

# 10. INVENTORY MANAGEMENT

## **POST /api/admin/variants/:id/adjust-stock**

Điều chỉnh tồn kho.

### Request

```typescript
{
  "action": "IMPORT",  // IMPORT | EXPORT | ADJUSTMENT
  "quantity": 50,      // Số dương = nhập, âm = xuất
  "referenceId": "order-uuid",  // Optional
  "note": "Nhập hàng từ nhà cung cấp ABC"
}
```

### Response

```typescript
{
  "success": true,
  "message": "Stock adjusted successfully",
  "data": {
    "variantId": "var-uuid",
    "oldStock": 100,
    "newStock": 150,
    "logId": "log-uuid"
  }
}
```

### Side Effects

- Tự động tạo `InventoryLog`
- Cập nhật `ProductVariant.stockAvailable`

---

## **GET /api/admin/inventory/logs**

Lịch sử tồn kho.

### Query Parameters

```typescript
{
  page?: number;
  limit?: number;
  variantId?: string;  // Filter by variant
  productId?: string;  // Filter by product
  action?: 'IMPORT' | 'EXPORT' | 'RETURN' | 'ADJUSTMENT';
  startDate?: string;  // ISO 8601
  endDate?: string;
}
```

### Response

```typescript
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "log-uuid-1",
        "variantId": "var-uuid",
        "variant": {
          "sku": "IP15-PM-256-BLU",
          "product": {
            "id": "prod-uuid",
            "name": "iPhone 15 Pro Max"
          }
        },
        "action": "IMPORT",
        "quantity": 50,
        "referenceId": "po-uuid",
        "createdAt": "2026-03-10T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 200,
      "totalPages": 4
    }
  }
}
```

---

# 11. IMAGE MANAGEMENT

## **POST /api/admin/products/:productId/images**

Upload ảnh sản phẩm.

### Request

```typescript
Content-Type: multipart/form-data

{
  file: <binary>,
  altText: "iPhone 15 Pro Max Blue",
  isPrimary: false,
  variantId: "var-uuid"  // Optional: gán cho variant cụ thể
}
```

### Response

```typescript
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "id": "img-uuid",
    "url": "https://cdn.example.com/uploads/img-uuid.jpg",
    "altText": "iPhone 15 Pro Max Blue",
    "sortOrder": 3,
    "isPrimary": false,
    "variantId": "var-uuid"
  }
}
```

---

## **PUT /api/admin/images/:id**

Cập nhật thông tin ảnh.

### Request

```typescript
{
  "altText": "Ảnh mới",
  "isPrimary": true,
  "sortOrder": 0,
  "variantId": "var-uuid"  // Gán cho variant khác
}
```

### Response

```typescript
{
  "success": true,
  "message": "Image updated successfully"
}
```

### Side Effects

- Set `isPrimary = true` → tự động set các ảnh khác của product = `false`

---

## **PUT /api/admin/images/reorder**

Sắp xếp lại thứ tự ảnh.

### Request

```typescript
{
  "imageIds": [
    "img-uuid-1",  // sortOrder = 0
    "img-uuid-3",  // sortOrder = 1
    "img-uuid-2"   // sortOrder = 2
  ]
}
```

### Response

```typescript
{
  "success": true,
  "message": "Images reordered successfully"
}
```

---

## **DELETE /api/admin/images/:id**

Xóa ảnh.

### Response

```typescript
{
  "success": true,
  "message": "Image deleted successfully"
}
```

---

# 12. PRICE HISTORY

## **GET /api/admin/products/:productId/price-history**

Lịch sử thay đổi giá.

### Query Parameters

```typescript
{
  page?: number;
  limit?: number;
  variantId?: string;  // Filter by variant
}
```

### Response

```typescript
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "history-uuid-1",
        "productId": "prod-uuid",
        "variantId": "var-uuid",
        "variant": {
          "sku": "IP15-PM-256-BLU"
        },
        "oldPrice": 29990000,
        "newPrice": 27990000,
        "changedBy": "admin-uuid",
        "changedAt": "2026-03-10T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "totalPages": 3
    }
  }
}
```

---

# 13. CATEGORIES & TAGS APIs

## **GET /api/admin/categories**

Lấy danh sách categories (tree structure).

### Response

```typescript
{
  "success": true,
  "data": [
    {
      "id": "cat-electronics",
      "name": "Điện tử",
      "slug": "dien-tu",
      "parentId": null,
      "sortOrder": 0,
      "children": [
        {
          "id": "cat-phone",
          "name": "Điện thoại",
          "slug": "dien-thoai",
          "parentId": "cat-electronics",
          "sortOrder": 0,
          "children": []
        }
      ]
    }
  ]
}
```

---

## **GET /api/admin/tags**

Lấy danh sách tags (flat list với autocomplete).

### Query Parameters

```typescript
{
  search?: string;  // Autocomplete search
  limit?: number;   // Default: 20
}
```

### Response

```typescript
{
  "success": true,
  "data": [
    {
      "id": "tag-uuid-1",
      "name": "Hot Deal",
      "slug": "hot-deal"
    }
  ]
}
```

---

# 14. GENERATE SKU

## **POST /api/admin/products/generate-sku**

Generate SKU tự động.

### Request

```typescript
{
  "productName": "iPhone 15 Pro Max",
  "attributes": {
    "storage": "256GB",
    "color": "Blue"
  }
}
```

### Response

```typescript
{
  "success": true,
  "data": {
    "sku": "IP15-PM-256-BLU-A1B2C3"  // Auto-generated
  }
}
```

### Logic

- Lấy viết tắt từ tên sản phẩm
- Thêm attributes
- Thêm random suffix để đảm bảo unique

---

# ERROR HANDLING

## Standard Error Response

```typescript
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": []  // Optional validation details
  }
}
```

## Common Error Codes

```typescript
// 400 Bad Request
VALIDATION_ERROR;
INVALID_INPUT;
MISSING_REQUIRED_FIELD;

// 401 Unauthorized
UNAUTHORIZED;
INVALID_TOKEN;
TOKEN_EXPIRED;

// 403 Forbidden
FORBIDDEN;
INSUFFICIENT_PERMISSIONS;

// 404 Not Found
PRODUCT_NOT_FOUND;
VARIANT_NOT_FOUND;
CATEGORY_NOT_FOUND;
TAG_NOT_FOUND;

// 409 Conflict
SKU_ALREADY_EXISTS;
DUPLICATE_ENTRY;
LAST_VARIANT; // Cannot delete last variant

// 500 Internal Server Error
INTERNAL_ERROR;
DATABASE_ERROR;
```

---

# BEST PRACTICES

## 1. Pagination

- Always limit `limit` max = 100
- Default: `page = 1`, `limit = 20`

## 2. Authorization

```typescript
// Middleware check ADMIN role
if (!req.user.roles.some((r) => r.role.code === 'ADMIN')) {
  return res.status(403).json({
    success: false,
    error: {
      code: 'FORBIDDEN',
      message: 'Admin access required',
    },
  });
}
```

## 3. Audit Log

Mọi thay đổi phải tạo `AuditLog`:

```typescript
await prisma.auditLog.create({
  data: {
    actorType: 'ADMIN',
    actorId: req.user.id,
    targetType: 'Product',
    targetId: product.id,
    action: 'UPDATE',
    oldData: oldProduct,
    newData: updatedProduct,
  },
});
```

## 4. Transaction

Sử dụng transaction cho operations phức tạp:

```typescript
await prisma.$transaction(async (tx) => {
  const product = await tx.product.create({...});
  await tx.productVariant.createMany({...});
  await tx.productImage.createMany({...});
  await tx.productCategory.createMany({...});
});
```

## 5. Soft Delete

- Không xóa vật lý khỏi DB
- Sử dụng `status = 'deleted'`
- Có thể restore

## 6. Price History

- Tự động log mọi thay đổi giá
- Giúp audit và analytics

## 7. File Upload

- Validate file type (jpg, png, webp)
- Validate file size (< 5MB)
- Upload to CDN (Cloudinary, S3)
- Return CDN URL

---

# PERFORMANCE OPTIMIZATION

## 1. Database Indexes

```prisma
@@index([status])
@@index([createdAt])
@@fulltext([name])
```

## 2. Query Optimization

- Use `select` to limit fields
- Use `include` carefully
- Avoid N+1 queries

## 3. Caching

- Cache category tree (Redis)
- Cache tags list (Redis)
- TTL: 1 hour

## 4. Rate Limiting

- Max 100 requests/minute per admin
- Max 10 bulk operations/hour

---

# SECURITY

## 1. Input Validation

- Sanitize HTML trong description
- Validate SKU format
- Validate price > 0
- Validate stock >= 0

## 2. File Upload

- Validate MIME type
- Scan for malware
- Restrict file size

## 3. SQL Injection

- Sử dụng Prisma (auto-escape)

## 4. XSS Prevention

- Sanitize user input
- Use Content Security Policy

---

# IMPLEMENTATION CHECKLIST

## Phase 1: Basic CRUD

- [ ] GET /api/admin/products (list)
- [ ] GET /api/admin/products/:id (detail)
- [ ] POST /api/admin/products (create)
- [ ] PUT /api/admin/products/:id (update)
- [ ] DELETE /api/admin/products/:id (soft delete)

## Phase 2: Variants

- [ ] POST /api/admin/products/:productId/variants
- [ ] PUT /api/admin/variants/:id
- [ ] DELETE /api/admin/variants/:id

## Phase 3: Images

- [ ] POST /api/admin/products/:productId/images
- [ ] PUT /api/admin/images/:id
- [ ] PUT /api/admin/images/reorder
- [ ] DELETE /api/admin/images/:id

## Phase 4: Inventory

- [ ] POST /api/admin/variants/:id/adjust-stock
- [ ] GET /api/admin/inventory/logs

## Phase 5: Bulk Operations

- [ ] POST /api/admin/products/bulk-delete
- [ ] POST /api/admin/products/bulk-assign-categories
- [ ] POST /api/admin/products/bulk-assign-tags

## Phase 6: Export & Utilities

- [ ] GET /api/admin/products/export
- [ ] POST /api/admin/products/generate-sku
- [ ] POST /api/admin/products/:id/restore

## Phase 7: Supporting APIs

- [ ] GET /api/admin/categories
- [ ] GET /api/admin/tags
- [ ] GET /api/admin/products/:productId/price-history

---

**END OF API SPECIFICATION**
