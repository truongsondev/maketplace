# BRP - Chức năng Thêm Variant Vào Giỏ Hàng (Add Variant to Cart)

> **⚠️ BUSINESS RULE QUAN TRỌNG**: Người dùng chỉ được thêm **VARIANT** vào giỏ hàng, không thêm Product trực tiếp. Mỗi Product bắt buộc phải có ít nhất 1 Variant.

---

## 📋 TÓM TẮT THAY ĐỔI (v2.0)

### Thay đổi chính so với v1.0:

1. **⭐ Variant là BẮT BUỘC**
   - Request body chỉ cần `variantId` + `quantity` (không cần `productId`)
   - Hệ thống tự lookup Product từ Variant
   - Error mới: `VARIANT_REQUIRED` (400) khi thiếu variantId

2. **⭐ Response bao gồm Image**
   - Mỗi cart item trả về `image` object
   - Priority: Ảnh variant → Ảnh product (fallback)
   - Format: `{ url, altText, isPrimary }` hoặc `null`

3. **⭐ Validation Rules cập nhật**
   - variantId is REQUIRED (không nullable)
   - Tất cả queries join từ Variant → Product (thay vì ngược lại)
   - Max quantity per variant: 10 items

4. **⭐ Database Queries điều chỉnh**
   - Query 1: `SELECT variant JOIN product` (thay vì product LEFT JOIN variant)
   - Query mới: Find image với fallback logic
   - Unique constraint enforced: `[cartId, productId, variantId]`

---

## 1. PHÂN TÍCH HIỆN TRẠNG

### 1.1 Database Schema

Từ phân tích Prisma Schema, hệ thống đã có:

- **Cart**: Mỗi user có 1 giỏ hàng duy nhất (relation 1:1 với User)
- **CartItem**: Lưu trữ các variant trong giỏ với số lượng
- **Product**: Sản phẩm cơ bản - chỉ là container, không bán trực tiếp
- **ProductVariant**: **ĐƠN VỊ BÁN HÀNG** - quản lý SKU, giá, tồn kho thực tế
- **ProductImage**: Ảnh có thể thuộc product (chung) hoặc variant cụ thể

### 1.2 Business Rules từ Schema

```prisma
model CartItem {
  id        String  @id
  cartId    String
  productId String  // Để biết sản phẩm gốc (dùng cho hiển thị tên product)
  variantId String? // ⚠️ Schema cho phép NULL, nhưng business rule BẮT BUỘC
  quantity  Int

  @@unique([cartId, productId, variantId])  // Mỗi variant unique trong cart
}

model ProductVariant {
  id             String
  productId      String
  sku            String   @unique
  attributes     Json     // {"color": "Red", "size": "M"}
  price          Decimal
  stockAvailable Int      // Tồn kho khả dụng
  stockReserved  Int      // Tồn kho đã giữ (trong giỏ/đơn hàng chưa thanh toán)
  isDeleted      Boolean
  images         ProductImage[]  // Ảnh riêng của variant
}

model ProductImage {
  productId String   // Ảnh của product (chung)
  variantId String?  // Ảnh riêng của variant (ưu tiên hơn)
  url       String
  isPrimary Boolean
  sortOrder Int
}
```

### 1.3 Image Logic (Quan trọng!)

**Thứ tự ưu tiên lấy ảnh cho variant:**

1. **Ảnh riêng của variant** (ProductImage có variantId = variant.id)
2. **Fallback**: Ảnh chung của product (ProductImage có variantId = NULL)

**Ảnh nào được trả về?**

- Ảnh primary (isPrimary = true) hoặc ảnh đầu tiên theo sortOrder

### 1.3 Module Hiện Tại

- ✅ **auth module**: Đã hoàn thiện
- ✅ **admin/products module**: Đã có quản lý product, variant, inventory
- ❌ **cart module**: **CHƯA TỒN TẠI** - cần tạo mới hoàn toàn

---

## 2. CÂU HỎI LÀM RÕ REQUIREMENTS

### 2.1 Về Business Logic

**Q1: Xử lý tồn kho khi thêm vào giỏ**

- [x] Có **reserve stock** (giữ hàng) khi thêm vào giỏ không?
  - ✅ **Confirmed**: Reserve ngay khi add to cart (stockReserved++)
  - Lý do: Tránh overselling, đảm bảo sản phẩm available khi user checkout
  - Trade-off: Cần có background job cleanup giỏ hàng abandoned (sau 24h-48h)

**Q2: Xử lý khi thêm variant đã tồn tại trong giỏ**

- [x] Thêm trùng variant thì làm gì?
  - ✅ **Confirmed**: Tăng số lượng (quantity += requestedQuantity)
  - Lý do: UX tốt hơn, user không cần vào giỏ để điều chỉnh
  - Validate: Tổng quantity sau khi cộng không vượt quá limit

**Q3: Giới hạn số lượng**

- [x] Có giới hạn số lượng tối đa mỗi variant không?
  - ✅ **Confirmed**: Max quantity = min(stockAvailable - stockReserved, 10)
  - Business limit: 10 items/variant (tránh 1 user mua hết hàng)
  - Technical limit: Tồn kho thực tế available

**Q4: Variant bắt buộc** ⭐ NEW

- [x] ✅ **CONFIRMED**: Variant là BẮT BUỘC
  - Mọi product phải có ít nhất 1 variant để bán
  - variantId trong request là REQUIRED field
  - Nếu thiếu variantId → return 400 VARIANT_REQUIRED
  - Schema vẫn nullable để backward compatible, nhưng app enforce NOT NULL

**Q5: Image Logic** ⭐ NEW

- [x] Ảnh nào được return cho variant?
  - ✅ **Priority 1**: Ảnh riêng của variant (ProductImage.variantId = variant.id)
  - ✅ **Priority 2 (Fallback)**: Ảnh chung của product (ProductImage.variantId = NULL)
  - Return: Ảnh primary hoặc ảnh đầu tiên theo sortOrder
  - Format: `{ url, altText, isPrimary }`

**Q6: Authentication**

- [x] Chỉ user đã đăng nhập mới được add to cart? → **YES** (có relation userId)
- [ ] Guest cart có cần không? → **NO** (Phase 1 không hỗ trợ)

### 2.2 Về Technical Implementation

**Q7: Validation Rules** ⭐ UPDATED

- [x] Validate gì trước khi add to cart?
  - ✅ variantId is REQUIRED (không được null/undefined)
  - ✅ Variant tồn tại và không bị xóa (isDeleted = false)
  - ✅ Product (parent) tồn tại và không bị xóa
  - ✅ Số lượng: 1 <= quantity <= 10
  - ✅ Tồn kho đủ: stockAvailable - stockReserved >= requestedQuantity
  - ✅ Tổng quantity (existing + new) <= MAX_QUANTITY_PER_VARIANT (10)

**Q8: Concurrent Access**

- [x] Xử lý race condition như thế nào?
  - ✅ **Solution**: Database transaction + optimistic locking trong UPDATE query
  - ✅ Unique constraint [cartId, productId, variantId] tự động xử lý duplicate
  - ✅ Retry logic nếu transaction conflict

**Q9: Error Handling**

- [x] Return gì khi lỗi?
  - ✅ Specific error codes:
    - VARIANT_REQUIRED (400)
    - VARIANT_NOT_FOUND (404)
    - OUT_OF_STOCK (409)
  - Product not found
  - Invalid quantity
  - **Đề xuất**: Specific error codes cho frontend xử lý

---

## 3. BUSINESS REQUIREMENTS (Giả định đã xác nhận)

### 3.1 Functional Requirements

**FR-1: Thêm variant vào giỏ hàng** ⭐ UPDATED

- **Actor**: User đã đăng nhập
- **Preconditions**:
  - User đã authentication thành công
  - Variant tồn tại, active và có tồn kho
  - Product (parent) tồn tại và active
- **Main Flow**:
  1. User gửi request với **variantId** (REQUIRED) và quantity
  2. System validate input (variantId not null, quantity 1-10)
  3. System lookup Product từ Variant
  4. System check tồn kho: `stockAvailable - stockReserved >= quantity`
  5. Nếu variant đã có trong giỏ → cộng dồn quantity (kiểm tra max limit)
  6. Nếu chưa có → tạo CartItem mới
  7. **Reserve stock**: `UPDATE product_variants SET stockReserved = stockReserved + quantity`
  8. Load image của variant (priority: variant image → product image)
  9. Return full cart detail với images

**FR-2: Validation Rules** ⭐ UPDATED

- variantId is REQUIRED (không được null/undefined/empty)
- quantity: 1 <= quantity <= MAX_QUANTITY_PER_VARIANT (10)
- Variant exists và isDeleted = false
- Product (parent) exists và isDeleted = false
- Tồn kho đủ: `stockAvailable - stockReserved >= quantity`
- Tổng quantity (existing + new) <= 10

**FR-3: Image Loading Logic** ⭐ NEW

- **Priority 1**: Lấy ảnh riêng của variant (ProductImage WHERE variantId = variant.id)
- **Priority 2**: Fallback về ảnh chung của product (ProductImage WHERE productId = product.id AND variantId IS NULL)
- Chọn ảnh: isPrimary = true HOẶC ảnh đầu tiên theo sortOrder ASC
- Return format: `{ url, altText, isPrimary }`

**FR-4: Auto-create Cart**

- Nếu user chưa có cart → tạo cart tự động
- Mỗi user chỉ có 1 cart duy nhất (enforce by DB unique constraint)

### 3.2 Non-Functional Requirements

**NFR-1: Performance**

- Response time < 500ms (P95)
- Hỗ trợ concurrent requests từ cùng user

**NFR-2: Data Consistency**

- Sử dụng database transaction
- Stock reservation phải atomic

**NFR-3: Security**

- Chỉ user sở hữu cart mới được thao tác
- Validate ownership trong middleware

---

## 4. TECHNICAL SPECIFICATION

### 4.1 API Endpoint

#### **POST /cart/items**

**Authentication**: Required (Bearer Token)

**Request Body**:

```typescript
{
  variantId: string; // UUID - REQUIRED ⭐
  quantity: number; // Integer, min: 1, max: 10 - REQUIRED
}
```

> **⚠️ Note**: `productId` không cần truyền, hệ thống tự lookup từ variantId

**Success Response (200 OK)**:

```typescript
{
  success: true,
  message: "Variant added to cart successfully",
  data: {
    cartId: string,
    totalItems: number,        // Số loại variant khác nhau trong giỏ
    totalQuantity: number,     // Tổng số lượng tất cả items
    items: [
      {
        id: string,              // CartItem.id
        productId: string,
        productName: string,
        variantId: string,       // Bắt buộc có giá trị ⭐
        variantInfo: {
          sku: string,           // "NIKE-AM90-RED-42"
          attributes: object,    // {"color": "Red", "size": "42"}
          price: number,         // Giá của variant này
          stockAvailable: number // Tồn kho hiện tại
        },
        image: {                 // ⭐ NEW - Ảnh của variant
          url: string,
          altText: string | null,
          isPrimary: boolean
        } | null,                // Null nếu không có ảnh
        quantity: number,        // Số lượng trong giỏ
        unitPrice: number,       // Giá 1 đơn vị (= variantInfo.price)
        subtotal: number         // quantity * unitPrice
      }
    ],
    totalAmount: number        // Tổng giá trị giỏ hàng
  }
}
```

**Error Responses**:

```typescript
// 400 Bad Request - Missing variant ⭐ NEW
{
  success: false,
  error: {
    code: "VARIANT_REQUIRED",
    message: "Variant ID is required. Please select a product variant."
  }
}
  success: false,
  error: {
    code: "VARIANT_REQUIRED",
    message: "Variant ID is required. Please select a product variant."
  }
}

// 400 Bad Request - Invalid quantity
{
  success: false,
  error: {
    code: "INVALID_QUANTITY",
    message: "Quantity must be between 1 and 10"
  }
}

// 404 Not Found - Variant not found
{
  success: false,
  error: {
    code: "VARIANT_NOT_FOUND",
    message: "Variant does not exist or has been deleted"
  }
}

// 404 Not Found - Product not found
{
  success: false,
  error: {
    code: "PRODUCT_NOT_FOUND",
    message: "Product does not exist or has been deleted"
  }
}

// 409 Conflict - Out of stock
{
  success: false,
  error: {
    code: "INSUFFICIENT_STOCK",
    message: "Not enough stock available for this variant",
    details: {
      variantId: "uuid",
      sku: "NIKE-AM90-RED-42",
      requested: 5,
      available: 3
    }
  }
}

// 409 Conflict - Exceeds max quantity
{
  success: false,
  error: {
    code: "EXCEEDS_MAX_QUANTITY",
    message: "Cannot add more than 10 items of this variant to cart",
    details: {
      maxQuantity: 10,
      currentInCart: 8,
      requested: 5
    }
  }
}

// 401 Unauthorized
{
  success: false,
  error: {
    code: "UNAUTHORIZED",
    message: "Authentication required. Please log in."
  }
}
```

### 4.2 Clean Architecture Structure

```
src/module/cart/
├── applications/
│   ├── dto/
│   │   ├── command/
│   │   │   └── add-to-cart.command.ts
│   │   └── result/
│   │       └── cart-detail.result.ts
│   ├── ports/
│   │   ├── input/
│   │   │   └── add-to-cart.usecase.ts (interface)
│   │   └── output/
│   │       ├── cart.repository.ts
│   │       └── product-availability.service.ts
│   ├── usecases/
│   │   └── add-to-cart.usecase.ts (implementation)
│   └── errors/
│       ├── product-not-found.error.ts
│       ├── insufficient-stock.error.ts
│       └── invalid-quantity.error.ts
├── entities/
│   ├── cart.entity.ts
│   └── cart-item.entity.ts
├── infrastructure/
│   ├── repositories/
│   │   ├── prisma-cart.repository.ts
│   │   └── prisma-product-availability.service.ts
│   └── api/
│       └── cart.api.ts
├── interface-adapter/
│   └── controller/
│       └── cart.controller.ts
└── di.ts
```

### 4.3 Use Case Flow ⭐ UPDATED

```typescript
// Pseudo-code
class AddToCartUseCase {
  async execute(command: AddToCartCommand): Promise<CartDetailResult> {
    // 1. Validate input
    if (!command.variantId) {
      throw new VariantRequiredError(); // ⭐ NEW
    }
    validateQuantity(command.quantity); // 1-10

    // 2. Start transaction
    return await this.prisma.$transaction(async (tx) => {
      // 3. Find variant và product (join)
      const variant = await variantRepo.findByIdWithProduct(command.variantId);

      if (!variant || variant.isDeleted) {
        throw new VariantNotFoundError();
      }

      const product = variant.product; // ⭐ Lookup từ variant
      if (!product || product.isDeleted) {
        throw new ProductNotFoundError();
      }

      // 4. Check stock availability
      const availableStock = variant.stockAvailable - variant.stockReserved;
      if (availableStock < command.quantity) {
        throw new InsufficientStockError({
          variantId: variant.id,
          sku: variant.sku,
          requested: command.quantity,
          available: availableStock,
        });
      }

      // 5. Get or create cart
      let cart = await cartRepo.findByUserId(userId);
      if (!cart) {
        cart = await cartRepo.create(userId);
      }

      // 6. Check existing item (unique by cartId + productId + variantId)
      const existingItem = await cartRepo.findItem(cart.id, product.id, variant.id);

      if (existingItem) {
        // 7a. Update quantity (cộng dồn)
        const newQuantity = existingItem.quantity + command.quantity;

        // Check max limit
        if (newQuantity > MAX_QUANTITY_PER_VARIANT) {
          throw new ExceedsMaxQuantityError({
            maxQuantity: MAX_QUANTITY_PER_VARIANT,
            currentInCart: existingItem.quantity,
            requested: command.quantity,
          });
        }

        // Double-check stock for new total
        if (availableStock < command.quantity) {
          throw new InsufficientStockError();
        }

        await cartRepo.updateItemQuantity(existingItem.id, newQuantity);

        // Reserve additional stock
        await variantRepo.reserveStock(variant.id, command.quantity);
      } else {
        // 7b. Create new cart item
        await cartRepo.addItem({
          cartId: cart.id,
          productId: product.id, // ⭐ Lưu để biết product gốc
          variantId: variant.id, // ⭐ Bắt buộc
          quantity: command.quantity,
        });

        // Reserve stock
        await variantRepo.reserveStock(variant.id, command.quantity);
      }

      // 8. Load image for variant ⭐ NEW
      const image = await imageRepo.findImageForVariant(variant.id, product.id);

      // 9. Return full cart detail with images
      return await cartRepo.getCartDetailWithImages(cart.id);
    });
  }
}
```

### 4.4 Database Operations ⭐ UPDATED

**Query 1: Find Variant với Product** (⭐ Thay đổi chính)

```sql
-- Lookup variant và join với product trong 1 query
SELECT
  v.id as variantId, v.sku, v.attributes, v.price,
  v.stockAvailable, v.stockReserved, v.isDeleted as variantDeleted,
  p.id as productId, p.name as productName, p.isDeleted as productDeleted
FROM product_variants v
INNER JOIN products p ON p.id = v.productId
WHERE v.id = ?
```

**Query 2: Find Image for Variant** (⭐ NEW)

```sql
-- Priority 1: Ảnh riêng của variant
-- Priority 2: Ảnh chung của product (fallback)
SELECT url, altText, isPrimary, sortOrder
FROM product_images
WHERE (variantId = ? OR (variantId IS NULL AND productId = ?))
  AND isPrimary = true
ORDER BY
  CASE WHEN variantId IS NOT NULL THEN 0 ELSE 1 END,  -- Variant image first
  isPrimary DESC,
  sortOrder ASC
LIMIT 1
```

**Query 3: Find Existing Cart Item**

```sql
SELECT * FROM cart_items
WHERE cartId = ?
  AND productId = ?
  AND variantId = ?  -- ⭐ Không còn check NULL
```

**Query 4: Reserve Stock (Update with Optimistic Locking)**

```sql
UPDATE product_variants
SET stockReserved = stockReserved + ?
WHERE id = ?
  AND (stockAvailable - stockReserved) >= ?  -- Optimistic check
  AND isDeleted = false
```

**Query 5: Get Cart Detail với Images** (⭐ UPDATED)

```sql
SELECT
  c.id as cartId,
  ci.id as itemId, ci.productId, ci.variantId, ci.quantity,
  p.name as productName,
  v.sku, v.attributes, v.price, v.stockAvailable,
  -- Subquery để lấy 1 ảnh duy nhất cho mỗi variant
  (
    SELECT JSON_OBJECT(
      'url', img.url,
      'altText', img.altText,
      'isPrimary', img.isPrimary
    )
    FROM product_images img
    WHERE (img.variantId = ci.variantId OR (img.variantId IS NULL AND img.productId = ci.productId))
    ORDER BY
      CASE WHEN img.variantId IS NOT NULL THEN 0 ELSE 1 END,
      img.isPrimary DESC,
      img.sortOrder ASC
    LIMIT 1
  ) as image
FROM carts c
LEFT JOIN cart_items ci ON ci.cartId = c.id
LEFT JOIN products p ON p.id = ci.productId
LEFT JOIN product_variants v ON v.id = ci.variantId
WHERE c.userId = ?
ORDER BY ci.createdAt DESC  -- Mới nhất trước
```

p.name as productName,
v.sku, v.attributes, v.price
FROM carts c
LEFT JOIN cart_items ci ON ci.cartId = c.id
LEFT JOIN products p ON p.id = ci.productId
LEFT JOIN product_variants v ON v.id = ci.variantId
WHERE c.id = ?

````

---

## 5. ERROR HANDLING

### 5.1 Error Codes ⭐ UPDATED

| Code | HTTP Status | Mô tả | Action |
|------|-------------|-------|--------|
| `VARIANT_REQUIRED` ⭐ | 400 | VariantId bắt buộc phải có | Chọn variant trước khi add |
| `INVALID_QUANTITY` | 400 | Quantity không hợp lệ (< 1 or > 10) | Fix input (1-10) |
| `VARIANT_NOT_FOUND` | 404 | Variant không tồn tại hoặc đã xóa | Chọn variant khác |
| `PRODUCT_NOT_FOUND` | 404 | Product (parent) không tồn tại | Refresh product list |
| `INSUFFICIENT_STOCK` | 409 | Tồn kho không đủ cho variant | Giảm quantity hoặc notify user |
| `EXCEEDS_MAX_QUANTITY` | 409 | Vượt quá 10 items/variant | Thông báo giới hạn |
| `UNAUTHORIZED` | 401 | Chưa đăng nhập | Redirect to login |

### 5.2 Edge Cases ⭐ UPDATED

**Case 1: User thêm 2 lần liên tiếp rất nhanh (race condition)**
- Solution: Database transaction + unique constraint `[cartId, productId, variantId]`
- Kết quả: Một request update quantity, request kia được merge automatic

**Case 2: Stock thay đổi giữa check và update**
- Solution: Optimistic locking trong UPDATE query với WHERE condition
  ```sql
  WHERE (stockAvailable - stockReserved) >= ?
````

- Nếu affected rows = 0 → retry hoặc throw InsufficientStockError

**Case 3: Variant bị xóa (soft delete) trong khi user đang thêm**

- Solution: Check `isDeleted = false` trong transaction
- Return VariantNotFoundError với message rõ ràng

**Case 4: User thêm variant không có ảnh** ⭐ NEW

- Solution: Fallback về ảnh product, nếu không có → return `image: null`
- Frontend hiển thị placeholder image

**Case 5: Product có nhiều variants nhưng user không chọn** ⭐ NEW

- Frontend responsibility: Bắt buộc chọn variant trước khi enable button "Add to Cart"
- Backend: Validate và return VARIANT_REQUIRED nếu thiếu

---

## 6. TESTING STRATEGY

### 6.1 Unit Tests

**Test Use Case Logic**:

```typescript
describe('AddToCartUseCase', () => {
  it('should add new item to cart successfully');
  it('should increase quantity for existing item');
  it('should throw error when product not found');
  it('should throw error when variant not found');
  it('should throw error when insufficient stock');
  it('should throw error when exceeds max quantity');
  it('should create cart if not exists');
  it('should reserve stock correctly');
});
```

## 6. TESTING STRATEGY

### 6.1 Unit Tests ⭐ UPDATED

**Test Use Case Logic**:

```typescript
describe('AddToCartUseCase', () => {
  it('should throw VARIANT_REQUIRED when variantId is missing') ⭐ NEW
  it('should add new variant to cart successfully')
  it('should increase quantity for existing variant')
  it('should throw VARIANT_NOT_FOUND when variant not exists')
  it('should throw PRODUCT_NOT_FOUND when product not exists')
  it('should throw INSUFFICIENT_STOCK when stock not enough')
  it('should throw EXCEEDS_MAX_QUANTITY when total > 10')
  it('should create cart if not exists')
  it('should reserve stock correctly')
  it('should load variant image correctly') ⭐ NEW
  it('should fallback to product image when variant has no image') ⭐ NEW
})
```

### 6.2 Integration Tests

**Test với Real Database**:

```typescript
describe('AddToCart Integration', () => {
  it('should handle concurrent add same variant requests')
  it('should rollback transaction on error')
  it('should enforce unique constraint [cartId, productId, variantId]')
  it('should correctly update stockReserved')
  it('should load image with correct priority (variant > product)') ⭐ NEW
})
```

### 6.3 API Tests ⭐ UPDATED

**Test HTTP Endpoint**:

```http
### Happy path - Add variant
POST http://localhost:3000/cart/items
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "variantId": "uuid-v1",
  "quantity": 2
}
# Expected: 200 OK với image trong response

### Missing variantId ⭐ NEW
POST http://localhost:3000/cart/items
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "quantity": 1
}
# Expected: 400 VARIANT_REQUIRED

### Variant not found
POST http://localhost:3000/cart/items
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "variantId": "invalid-uuid",
  "quantity": 1
}
# Expected: 404 VARIANT_NOT_FOUND

### Insufficient stock
POST http://localhost:3000/cart/items
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "variantId": "uuid-v1",
  "quantity": 999
}
# Expected: 409 INSUFFICIENT_STOCK

### Exceeds max quantity (add 5, then add 8)
POST http://localhost:3000/cart/items
{
  "variantId": "uuid-v1",
  "quantity": 5
}
# Then
POST http://localhost:3000/cart/items
{
  "variantId": "uuid-v1",
  "quantity": 8
}
# Expected: 409 EXCEEDS_MAX_QUANTITY (5 + 8 = 13 > 10)
```

### 6.4 Performance Tests

**Load Testing Scenarios**:

- 100 concurrent users add to cart
- 1 user add 10 items rapidly
- Target: P95 < 500ms

---

## 7. IMPLEMENTATION PLAN

### 7.1 Phases

**Phase 1: Core Implementation (2-3 days)**

- [ ] Setup cart module structure (Clean Architecture)
- [ ] Implement entities và DTOs
- [ ] Implement repositories (Prisma)
- [ ] Implement AddToCartUseCase
- [ ] Implement controller & API route
- [ ] Setup DI container
- [ ] Unit tests

**Phase 2: Integration & Testing (1-2 days)**

- [ ] Integration tests
- [ ] API tests với Postman/REST Client
- [ ] Error handling refinement
- [ ] Logging & monitoring

**Phase 3: Advanced Features (Future)**

- [ ] Get cart detail endpoint
- [ ] Update cart item quantity
- [ ] Remove cart item
- [ ] Clear cart
- [ ] Guest cart support

### 7.2 Tasks Breakdown

**Backend Developer Tasks**:

1. **Setup Module Structure** (1h)
   - Tạo folder structure theo Clean Architecture
   - Setup base files và exports

2. **Domain Layer** (2h)
   - Cart entity
   - CartItem entity
   - Domain errors

**Backend Developer Tasks**: ⭐ UPDATED

1. **Setup Module Structure** (1h)
   - Tạo folder structure theo Clean Architecture
   - Setup base files và exports

2. **Domain Layer** (2h)
   - Cart entity
   - CartItem entity (với variantId required validation)
   - Domain errors (thêm VariantRequiredError)

3. **Application Layer** (5h) ⭐ +1h
   - AddToCartCommand DTO (variantId required, không có productId)
   - CartDetailResult DTO (thêm image field)
   - IAddToCartUseCase interface
   - ICartRepository interface
   - IProductImageRepository interface ⭐ NEW
   - AddToCartUseCase implementation (variant-first logic)
   - Error definitions

4. **Infrastructure Layer** (5h) ⭐ +1h
   - PrismaCartRepository implementation
   - PrismaProductImageRepository implementation ⭐ NEW
   - Image loading logic (priority: variant → product)
   - Stock reservation logic
   - Transaction handling

5. **Interface Adapter Layer** (2h)
   - CartController
   - Request validation (variantId required)
   - Response mapping (include image)

6. **API & DI** (2h)
   - Cart API routes
   - DI container setup
   - Middleware integration (auth)

7. **Testing** (5h) ⭐ +1h
   - Unit tests (use case + image logic)
   - Integration tests
   - API tests (test all error cases)

**Total Estimate**: ~22 hours (3 ngày làm việc)

### 7.3 Dependencies

**Prerequisites**:

- ✅ Auth module (để authenticate user)
- ✅ Product module admin (có sẵn product & variant)
- ✅ Prisma schema (đã define Cart, CartItem)
- ✅ Error handling infrastructure

**Database Migration**: KHÔNG CẦN (schema đã có)

---

## 8. MONITORING & METRICS

### 8.1 Key Metrics

- **Conversion Rate**: % users thêm vào giỏ vs checkout
- **Cart Abandonment**: % giỏ hàng bị bỏ dở
- **Average Cart Value**: Giá trị trung bình mỗi giỏ
- **Add to Cart Errors**: Tỷ lệ lỗi (out of stock, etc.)

### 8.2 Logging

```typescript
logger.info('Add to cart attempt', {
  userId,
  productId,
  variantId,
  quantity,
  timestamp,
});

logger.error('Add to cart failed', {
  userId,
  errorCode: 'INSUFFICIENT_STOCK',
  productId,
  requestedQty,
  availableQty,
});
```

---

## 9. FOLLOW-UP QUESTIONS FOR STAKEHOLDERS

**Business Questions**:

1. Có cần thông báo email/notification khi thêm vào giỏ không?
2. Có cần tracking user behavior (GA, Mixpanel) không?
3. Stock reserve timeout bao lâu? (nếu user không checkout)
4. Chính sách xử lý khi sản phẩm trong giỏ hết hàng?

**Technical Questions**:

1. Redis cache có cần không? (cache cart detail)
2. Có cần queue system (RabbitMQ) không? (async stock update)
3. Có cần Webhook khi add to cart thành công không?

---

## 10. ACCEPTANCE CRITERIA

### 10.1 Functional

✅ **Done When**:

- [ ] User đăng nhập có thể thêm sản phẩm vào giỏ
- [ ] Hệ thống validate đầy đủ (product, variant, stock, quantity)
- [ ] Thêm trùng sản phẩm sẽ tăng quantity
- [ ] Stock được reserve chính xác
- [ ] Return đầy đủ thông tin cart detail
- [ ] Error messages rõ ràng, có error code
- [ ] Unit test coverage ≥ 80%
- [ ] API documentation đầy đủ

### 10.2 Non-Functional

✅ **Done When**:

- [ ] Response time P95 < 500ms
- [ ] Xử lý được 100 concurrent requests
- [ ] No data loss trong concurrent scenario
- [ ] Logging đầy đủ cho monitoring
- [ ] Code follow Clean Architecture
- [ ] Pass security review (authorization check)

---

## 11. REFERENCES

**Related Documents**:

- [Prisma Schema](../prisma/schema.prisma)
- [Auth Module Implementation](../src/module/auth/)
- [Admin Products Module](../src/module/admin/products/)

**External Resources**:

- Clean Architecture by Robert C. Martin
- Prisma Best Practices: https://www.prisma.io/docs/guides/performance-and-optimization
- REST API Design: https://restfulapi.net/

---

## APPENDIX A: Sample Data ⭐ UPDATED

**Product Sample**:

```json
{
  "id": "prod-001",
  "name": "Nike Air Max 90",
  "basePrice": 3500000,
  "isDeleted": false
}
```

**Variant Sample**:

```json
{
  "id": "var-001",
  "productId": "prod-001",
  "sku": "NIKE-AM90-RED-42",
  "attributes": { "color": "Red", "size": "42" },
  "price": 3500000,
  "stockAvailable": 50,
  "stockReserved": 5,
  "isDeleted": false
}
```

**ProductImage Sample**: ⭐ NEW

```json
[
  {
    "id": "img-001",
    "productId": "prod-001",
    "variantId": "var-001", // Ảnh riêng của variant Red-42
    "url": "https://res.cloudinary.com/.../nike-am90-red-42.jpg",
    "altText": "Nike Air Max 90 Red Size 42",
    "isPrimary": true,
    "sortOrder": 0
  },
  {
    "id": "img-002",
    "productId": "prod-001",
    "variantId": null, // Ảnh chung của product (fallback)
    "url": "https://res.cloudinary.com/.../nike-am90-default.jpg",
    "altText": "Nike Air Max 90",
    "isPrimary": true,
    "sortOrder": 0
  }
]
```

**Request Sample**:

```json
{
  "variantId": "var-001", // ⭐ REQUIRED
  "quantity": 2
}
```

**Response Sample** (Full Cart):

```json
{
  "success": true,
  "message": "Variant added to cart successfully",
  "data": {
    "cartId": "cart-001",
    "totalItems": 2,
    "totalQuantity": 5,
    "items": [
      {
        "id": "item-001",
        "productId": "prod-001",
        "productName": "Nike Air Max 90",
        "variantId": "var-001", // ⭐ Bắt buộc có
        "variantInfo": {
          "sku": "NIKE-AM90-RED-42",
          "attributes": { "color": "Red", "size": "42" },
          "price": 3500000,
          "stockAvailable": 48
        },
        "image": {
          // ⭐ NEW
          "url": "https://res.cloudinary.com/.../nike-am90-red-42.jpg",
          "altText": "Nike Air Max 90 Red Size 42",
          "isPrimary": true
        },
        "quantity": 2,
        "unitPrice": 3500000,
        "subtotal": 7000000
      },
      {
        "id": "item-002",
        "productId": "prod-002",
        "productName": "Adidas Ultraboost",
        "variantId": "var-010",
        "variantInfo": {
          "sku": "ADIDAS-UB-BLACK-41",
          "attributes": { "color": "Black", "size": "41" },
          "price": 4200000,
          "stockAvailable": 30
        },
        "image": null, // ⭐ Variant này không có ảnh
        "quantity": 3,
        "unitPrice": 4200000,
        "subtotal": 12600000
      }
    ],
    "totalAmount": 19600000
  }
}
```

---

**Document Version**: 2.0 ⭐  
**Last Updated**: 2026-03-12  
**Author**: Business Analyst  
**Status**: Updated - Variant-First Approach  
**Changes**:

- Variant is now REQUIRED (not optional)
- Added image loading logic & response
- Updated all examples and flows
- Added new error code: VARIANT_REQUIRED
  "variantId": "var-001",
  "quantity": 2
  }
  ]
  }

```

---

**Document Version**: 1.0
**Last Updated**: 2026-03-12
**Author**: Business Analyst
**Status**: Draft - Pending Confirmation
```
