# Migration plan: Schema hiện tại → Catalog long-term (ProductType + Attribute System)

Mục tiêu: chuyển từ mô hình hiện tại (variant attributes JSON + soft delete boolean + product_images polymorphic) sang mô hình **bền**, query/filter được, chống dữ liệu bẩn tốt hơn — **nhưng làm theo kiểu thực chiến, ít downtime**.

Tài liệu này assume:

- Bạn đang dùng MySQL + Prisma
- Code hiện tại vẫn đang chạy với schema cũ
- Bạn muốn migrate theo kiểu **additive trước**, rồi mới cutover dần

---

## 0) Snapshot schema hiện tại (liên quan catalog)

### Hiện tại đang có

- `Product`
  - `basePrice` (giá hiển thị)
  - `isNew`, `isSale`
  - `isDeleted` (soft delete kiểu boolean)
- `ProductVariant`
  - `sku` unique
  - `attributes Json` (vd: `{ "color": "đỏ", "size": "M" }`)
  - `price`, `stockAvailable`, `stockReserved`
  - `isDeleted`
- `ProductImage`
  - `productId` + `variantId?` (polymorphic)
- `Category` tree (parentId) + `imageUrl`
- `ProductCategory` (join table)

### Vấn đề “đi đường dài”

- JSON attributes → khó filter/facet, khó validate, dễ bẩn data
- Soft delete boolean + unique fields → dính conflict khi tái tạo SKU/slug
- Variant dedup chưa có (trùng combination color/size vẫn có thể xảy ra)
- `ProductCategory` chưa có `isPrimary`/`sortOrder` để merchandising

---

## 1) Target state (tóm tắt)

- `ProductType`: định nghĩa loại sản phẩm
- Attribute system chuẩn:
  - `AttributeDefinition`, `AttributeOption`, `ProductTypeAttribute`
  - `ProductAttributeValue`, `VariantAttributeValue` (+ bảng join cho multi-select)
- `ProductVariant.optionKey`: canonical key để chặn trùng variant: `color=red|size=m`
- Soft delete chuẩn: `deletedAt` (giữ `isDeleted` trong giai đoạn chuyển tiếp)

Chi tiết domain & Prisma schema long-term xem trong `bd.md`.

---

## 2) Chiến lược migration (khuyến nghị thực chiến)

### Phase A — Additive schema (không phá code hiện tại)

Trong repo, mình đã **đã thêm các bảng/field long-term vào** `server/prisma/schema.prisma` theo kiểu additive:

- Thêm enums: `ProductStatus`, `VariantStatus`, `AttributeScope`, `AttributeDataType`
- Thêm models: `ProductType`, `AttributeDefinition`, `AttributeOption`, `ProductTypeAttribute`, `ProductAttributeValue`, `VariantAttributeValue`, ...
- Thêm fields (nullable / có default) vào:
  - `Product`: `productTypeId?`, `status`, `minPrice?`, `maxPrice?`, `deletedAt?`
  - `ProductVariant`: `optionKey?`, `status`, `isDefault`, `stockOnHand`, `deletedAt?` (giữ `attributes Json` và `stockAvailable` để chạy song song)
  - `ProductCategory`: `isPrimary`, `sortOrder`
  - `Category`: `deletedAt?`

**Kết quả:** bạn có thể migrate DB mà code cũ vẫn chạy (vì các field mới không bắt buộc).

### Phase B — Backfill dữ liệu (script chạy 1 lần / idempotent)

Sau khi Prisma migration được apply, chạy script backfill:

- Tạo `ProductType` mặc định (`default`)
- Set `Product.productTypeId` cho toàn bộ sản phẩm existing
- Backfill `ProductVariant.stockOnHand` từ `stockAvailable`
- Backfill `ProductVariant.optionKey` từ `attributes Json` (canonical hóa)
- Đặt `isDefault` cho variant “mặc định” mỗi product
- Set `ProductCategory.isPrimary` cho 1 category chính

Script: `server/scripts/backfill-longterm-catalog.mjs`

Sau đó (khuyến nghị) seed + backfill cho **attribute system**:

- Seed `ProductType` (theo plan rút gọn: `ao`, `quan`, `phu_kien`, `vong_tay`) + `AttributeDefinition/Option` + mapping `ProductTypeAttribute`
- Backfill:
  - Tự gán `Product.productTypeId` theo root category (`ao`/`quan`/khác → `phu_kien`; nếu có root `vong-tay` thì → `vong_tay`)
  - Migrate `ProductVariant.attributes` JSON (`color`, `size`) → `VariantAttributeValue` (tự tạo `AttributeOption` nếu gặp giá trị mới)

Scripts:

- `server/scripts/seed-attribute-system.mjs`
- `server/scripts/backfill-variant-attributes.mjs`

Quan trọng: Sau cutover code, một số flow (cart/payment) sẽ đọc `stockOnHand`. Vì `stockOnHand` mới thêm có default = 0, **bạn phải chạy backfill trước khi start server**, nếu không hệ thống sẽ coi như hết hàng.

### Phase C — Cutover code (đổi source of truth dần)

1. **Variant dedup & bán hàng**

- Bắt đầu tạo/sửa variant theo `VariantAttributeValue` + build `optionKey`
- `ProductVariant.attributes Json` chỉ còn legacy (hoặc giữ sync tạm thời)

2. **Filter & Facet**

- UI/filter query chuyển sang join `VariantAttributeValue` / `ProductAttributeValue`

3. **Inventory**

- Code chuyển sang đọc `stockOnHand/stockReserved`
- Giữ `stockAvailable` chỉ để rollback hoặc xóa về sau

### Phase D — Cleanup (khi hệ thống ổn)

- Enforce stricter constraints:
  - OptionKey: set NOT NULL (Prisma: biến `optionKey` thành required)
  - Unique variant: `@@unique([productId, optionKey])` đã có; lúc này sẽ enforce thực tế
- Deprecate & drop:
  - `ProductVariant.attributes` JSON
  - `Product.isDeleted`, `ProductVariant.isDeleted`, và chuyển hẳn sang `deletedAt`

---

## 3) Vấn đề quan trọng & rule validate (service bắt buộc)

### 3.1 optionKey canonicalization

- Luôn sort theo `ProductTypeAttribute.variantAxisOrder`
- Format cố định: `code=value|code=value`
- Khi backfill từ JSON (không có axis order) → tạm sort theo key alphabet

### 3.2 Chặn dữ liệu bẩn (DB không chặn hết)

- `SELECT/MULTI_SELECT`: `optionId` phải thuộc đúng `attributeId` → validate ở service
- Typed columns one-of (`textValue/numberValue/optionId`) → validate ở service

### 3.3 Soft delete & unique fields

- Giai đoạn đầu: giữ `isDeleted` để code cũ chạy
- Dài hạn: chuyển sang `deletedAt` + rewrite unique fields khi soft delete (SKU/slug/optionKey)

---

## 4) Commands (tham khảo)

> Tuỳ môi trường, bạn chạy Prisma bằng:
>
> - `npx prisma migrate dev`
> - hoặc `npx prisma migrate deploy`

Ví dụ (dev):

- `cd server`
- `npx prisma migrate dev --name add-longterm-catalog-foundations`
- `node scripts/backfill-longterm-catalog.mjs`
- `node scripts/seed-attribute-system.mjs`
- `node scripts/backfill-variant-attributes.mjs`

---

## 5) Lưu ý về `ProductImage` (polymorphic)

Hiện tại `ProductImage` có `variantId?`. Long-term “sạch” nhất là tách:

- `ProductImage` (product-only)
- `VariantImage` (variant-only)

Nhưng việc này sẽ đụng code/API. Khuyến nghị:

- Giữ hiện trạng trong Phase A/B/C
- Khi rảnh refactor, tạo bảng mới + backfill từ `ProductImage` nơi `variantId IS NOT NULL`

---

## 6) Checklist trước khi cutover

- [ ] Mỗi product có >= 1 variant
- [ ] Mỗi variant có `optionKey` (không null)
- [ ] Không có duplicate `(productId, optionKey)`
- [ ] Các type/attribute mapping đã được define cho các nhóm sản phẩm chính
- [ ] (Nếu dùng filter/facet mới) `VariantAttributeValue` đã được backfill cho `color/size`
