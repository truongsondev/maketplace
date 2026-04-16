# Thiết kế lại DB Ecommerce “đi đường dài” (Production-ready)

Mục tiêu của thiết kế này: **schema bền**, **không nát về sau**, mở rộng loại sản phẩm/thuộc tính **không phải thêm cột**, query/filter được **chuẩn**, và **chặn dữ liệu bẩn** ở mức DB + service.

> Nguyên tắc:
>
> - `Product` = thực thể “catalog” chung (nội dung, SEO, mô tả, type, trạng thái)
> - `ProductVariant` = thực thể “bán hàng” (SKU/giá/tồn kho)
> - Attribute system = EAV “có kiểm soát” (typed columns + option tables), không JSON làm trung tâm

---

## 1) Kiến trúc dữ liệu tổng thể

### Nhóm bảng chính

1. **Catalog core**

- `ProductType`: định nghĩa “loại sản phẩm” (Áo, Vòng tay, Mũ…) và rules attribute áp dụng
- `Product`: thông tin chung của sản phẩm (title, description, brand, status, …)
- `ProductVariant`: biến thể để bán (SKU, giá, tồn kho…); **luôn có ít nhất 1 variant mặc định**

2. **Category & merchandising**

- `Category`: cây category (adjacency list) + sort
- `ProductCategory`: N-N giữa product và category (có `isPrimary`, `sortOrder`)

3. **Media**

- `ProductImage`: ảnh gắn với product
- `VariantImage`: ảnh gắn với variant

> Vì sao tách `ProductImage` và `VariantImage`?
>
> - Tránh dữ liệu bẩn kiểu “ảnh vừa productId vừa variantId”
> - DB constraint/Prisma dễ kiểm soát hơn so với 1 bảng polymorphic

4. **Attribute system (động nhưng có kiểm soát)**

- `AttributeDefinition`: định nghĩa attribute (code, name, dataType, scope…)
- `ProductTypeAttribute`: mapping type ↔ attribute (required/filterable/variantAxis…)
- `AttributeOption`: option cho attribute dạng select (Color/Size/Style…)
- `ProductAttributeValue`: giá trị attribute cấp Product (typed)
- `VariantAttributeValue`: giá trị attribute cấp Variant (typed)

5. **Inventory (thực chiến, có đường đi dài)**

- Tối thiểu: giữ `stockOnHand`, `stockReserved` ở `ProductVariant`
- Optional nâng cấp: `InventoryLocation`, `InventoryMovement`/`Ledger` để audit & multi-warehouse

6. **Price (thực chiến, có đường đi dài)**

- Source of truth: `ProductVariant.price`
- `Product.basePrice`/`minPrice`/`maxPrice` (nếu có) chỉ là **cache hiển thị**, không phải nguồn sự thật
- Optional nâng cấp: `PriceList`, `Promotion`, `Coupon`, `TierPrice`… tách riêng

### Vì sao phù hợp bài toán “nhiều loại sản phẩm, mỗi loại thuộc tính riêng”

- Mọi “khác nhau giữa loại sản phẩm” đi qua `ProductType` + `ProductTypeAttribute`
- Thêm loại mới: thêm bản ghi `ProductType`, define attributes; **không đổi schema**
- Thêm attribute mới: thêm `AttributeDefinition` (+ options nếu cần), map vào type; **không thêm cột Product**

---

## 2) Phân biệt rõ domain model

### Cái gì thuộc `Product`

- Danh tính catalog: `name`, `slug`, `description`, `productTypeId`, `status` (draft/active/archived)
- Thông tin mô tả chung: brand, material summary, story, care instructions (nếu muốn)
- SEO: metaTitle/metaDescription
- Merchandising: `sortOrder`, `primaryCategoryId` (hoặc qua `ProductCategory.isPrimary`)
- Cache hiển thị: `minPrice`, `maxPrice` (tính từ variants)

### Cái gì thuộc `ProductVariant`

- Bán hàng: `sku`, `price`, `compareAtPrice` (optional), `cost` (optional)
- Kho: `stockOnHand`, `stockReserved`
- Trạng thái bán: `status` (active/inactive), `isDefault`
- Dấu vết: barcode (optional), weight/dimensions (optional)

### Thuộc tính mô tả vs thuộc tính tạo variant

- **Mô tả (descriptive attributes)**: có thể ở Product hoặc Variant, dùng để hiển thị và filter
  - Ví dụ áo: chất liệu (cotton), kiểu tay áo… thường đặt ở **Product** nếu không đổi theo variant
- **Tạo variant (variant axes)**: thuộc tính quyết định “một biến thể khác”
  - Ví dụ áo: Color + Size = axes; lưu ở **VariantAttributeValue**

Quy tắc thực chiến:

- Nếu attribute **thay đổi theo SKU** → phải thuộc Variant
- Nếu attribute **không đổi theo SKU** → thuộc Product

---

## 3) Thiết kế attribute system (thực chiến)

### 3.1 Định nghĩa attribute

`AttributeDefinition` chứa:

- `code`: khóa kỹ thuật, ổn định lâu dài (`color`, `size`, `material`, `bracelet_diameter`…)
- `name`: tên hiển thị
- `scope`: `PRODUCT` hoặc `VARIANT`
- `dataType`: `TEXT`, `NUMBER`, `BOOLEAN`, `DATE`, `SELECT`, `MULTI_SELECT`
- `unit`: nếu là number (cm, mm…)

### 3.2 Mapping attribute với product type

`ProductTypeAttribute` quyết định:

- type nào dùng attribute nào
- `isRequired`
- `isFilterable` (dùng làm facet)
- `isVariantAxis` (attribute tạo biến thể)
- `variantAxisOrder` (order khi build key)

Rule quan trọng:

- `isVariantAxis = true` ⇒ `scope` phải là `VARIANT` và `dataType` nên là `SELECT` (hoặc NUMBER nếu size numeric)

### 3.3 Option cho select

`AttributeOption`:

- gắn với `AttributeDefinition`
- có `value` (ví dụ `red`) + `label` (Đỏ)
- có thể có `swatchHex` cho màu (optional)

### 3.4 Lưu value (typed, tránh JSON bừa bãi)

- `ProductAttributeValue` & `VariantAttributeValue` có các cột:
  - `textValue`, `numberValue`, `booleanValue`, `dateValue`, `optionId`
- Với `MULTI_SELECT`: dùng thêm bảng join `ProductAttributeValueOption` / `VariantAttributeValueOption`

> Vì sao không nhét JSON làm trung tâm?
>
> - JSON khó index đúng nghĩa cho filter/facet (trừ khi hy sinh performance hoặc viết expression indexes phức tạp)
> - Dễ “bẩn data”: mỗi product một schema khác nhau, không validate được
> - Service càng ngày càng khó maintain

---

## 4) Prisma schema đề xuất (đầy đủ cho catalog domain)

Ghi chú:

- Mình dùng MySQL + Prisma. Naming clean, dùng `@map`/`@@map` để map sang snake_case.
- Soft delete: dùng `deletedAt` + **best practice thực chiến**: khi soft-delete record có unique fields (sku, slug, optionKey) nên **rewrite** field để giải phóng unique (chi tiết ở phần 5).

```prisma
// =========================
// ENUMS
// =========================

enum ProductStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}

enum VariantStatus {
  ACTIVE
  INACTIVE
}

enum AttributeScope {
  PRODUCT
  VARIANT
}

enum AttributeDataType {
  TEXT
  NUMBER
  BOOLEAN
  DATE
  SELECT
  MULTI_SELECT
}

// =========================
// PRODUCT TYPE
// =========================

model ProductType {
  id          String   @id @default(uuid())
  code        String   @unique
  name        String
  description String?
  createdAt   DateTime @default(now(3)) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  products    Product[]
  attributes  ProductTypeAttribute[]

  @@map("product_types")
  @@index([deletedAt], map: "idx_product_types_deleted_at")
}

// =========================
// CATEGORY
// =========================

model Category {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  description String?
  imageUrl    String?  @map("image_url")
  parentId    String?  @map("parent_id")
  sortOrder   Int      @default(0) @map("sort_order")
  createdAt   DateTime @default(now(3)) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  parent      Category?  @relation("CategoryParent", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryParent")

  products    ProductCategory[]

  @@map("categories")
  @@index([parentId, sortOrder], map: "idx_categories_parent_sort")
  @@index([deletedAt], map: "idx_categories_deleted_at")
}

// Optional (đi đường dài): closure table cho subtree queries nhanh
model CategoryClosure {
  ancestorId   String @map("ancestor_id")
  descendantId String @map("descendant_id")
  depth        Int

  ancestor     Category @relation("CategoryClosureAncestor", fields: [ancestorId], references: [id])
  descendant   Category @relation("CategoryClosureDescendant", fields: [descendantId], references: [id])

  @@id([ancestorId, descendantId])
  @@map("category_closure")
  @@index([descendantId, depth], map: "idx_category_closure_desc_depth")
}

// =========================
// PRODUCT
// =========================

model Product {
  id            String        @id @default(uuid())
  productTypeId String        @map("product_type_id")

  name          String
  slug          String        @unique
  description   String?

  status        ProductStatus @default(DRAFT)
  sortOrder     Int           @default(0) @map("sort_order")

  // Cached display price (not source of truth)
  minPrice      Decimal?      @db.Decimal(18, 2) @map("min_price")
  maxPrice      Decimal?      @db.Decimal(18, 2) @map("max_price")

  createdAt     DateTime      @default(now(3)) @map("created_at")
  updatedAt     DateTime      @updatedAt @map("updated_at")
  deletedAt     DateTime?     @map("deleted_at")

  productType   ProductType   @relation(fields: [productTypeId], references: [id])

  variants      ProductVariant[]
  images        ProductImage[]
  categories    ProductCategory[]

  attributes    ProductAttributeValue[]

  @@map("products")
  @@index([productTypeId, status], map: "idx_products_type_status")
  @@index([deletedAt], map: "idx_products_deleted_at")
}

// =========================
// PRODUCT VARIANT
// =========================

model ProductVariant {
  id            String       @id @default(uuid())
  productId     String       @map("product_id")

  // SKU should be unique across system (or per seller/store if multi-tenant)
  sku           String       @unique

  // Canonical key representing variant axes, e.g. "color=red|size=m"
  // Used to prevent duplicate variants for same product.
  optionKey     String       @map("option_key")

  title         String?      // optional: "Đỏ / M"
  status        VariantStatus @default(ACTIVE)
  isDefault     Boolean      @default(false) @map("is_default")

  price         Decimal      @db.Decimal(18, 2)
  compareAtPrice Decimal?    @db.Decimal(18, 2) @map("compare_at_price")

  stockOnHand   Int          @default(0) @map("stock_on_hand")
  stockReserved Int          @default(0) @map("stock_reserved")

  createdAt     DateTime     @default(now(3)) @map("created_at")
  updatedAt     DateTime     @updatedAt @map("updated_at")
  deletedAt     DateTime?    @map("deleted_at")

  product       Product      @relation(fields: [productId], references: [id])

  images        VariantImage[]
  attributes    VariantAttributeValue[]

  @@map("product_variants")
  @@unique([productId, optionKey], map: "uq_variant_product_option_key")
  @@index([productId, status], map: "idx_variants_product_status")
  @@index([deletedAt], map: "idx_variants_deleted_at")
}

// =========================
// PRODUCT ↔ CATEGORY
// =========================

model ProductCategory {
  productId  String @map("product_id")
  categoryId String @map("category_id")

  isPrimary  Boolean @default(false) @map("is_primary")
  sortOrder  Int     @default(0) @map("sort_order")

  product    Product  @relation(fields: [productId], references: [id])
  category   Category @relation(fields: [categoryId], references: [id])

  @@id([productId, categoryId])
  @@map("product_categories")
  @@index([categoryId, isPrimary, sortOrder], map: "idx_product_categories_cat_primary_sort")
}

// =========================
// IMAGES
// =========================

model ProductImage {
  id        String   @id @default(uuid())
  productId String   @map("product_id")

  url       String
  altText   String?  @map("alt_text")
  sortOrder Int      @default(0) @map("sort_order")
  isPrimary Boolean  @default(false) @map("is_primary")

  createdAt DateTime @default(now(3)) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  product   Product  @relation(fields: [productId], references: [id])

  @@map("product_images")
  @@index([productId, sortOrder], map: "idx_product_images_product_sort")
}

model VariantImage {
  id        String   @id @default(uuid())
  variantId String   @map("variant_id")

  url       String
  altText   String?  @map("alt_text")
  sortOrder Int      @default(0) @map("sort_order")
  isPrimary Boolean  @default(false) @map("is_primary")

  createdAt DateTime @default(now(3)) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  variant   ProductVariant @relation(fields: [variantId], references: [id])

  @@map("variant_images")
  @@index([variantId, sortOrder], map: "idx_variant_images_variant_sort")
}

// =========================
// ATTRIBUTE DEFINITIONS
// =========================

model AttributeDefinition {
  id        String           @id @default(uuid())
  code      String           @unique
  name      String
  scope     AttributeScope
  dataType  AttributeDataType @map("data_type")

  // Optional: unit for NUMBER (cm, mm, ...)
  unit      String?

  // Optional: to support localized labels later
  createdAt DateTime @default(now(3)) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  options   AttributeOption[]
  typeMaps  ProductTypeAttribute[]

  @@map("attribute_definitions")
  @@index([scope, dataType], map: "idx_attr_def_scope_type")
}

model AttributeOption {
  id          String   @id @default(uuid())
  attributeId String   @map("attribute_id")

  value       String   // technical value: "red", "m"
  label       String   // display label: "Đỏ", "M"
  sortOrder   Int      @default(0) @map("sort_order")

  // Optional helpers (e.g., color swatch)
  swatchHex   String?  @map("swatch_hex")

  createdAt   DateTime @default(now(3)) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  attribute   AttributeDefinition @relation(fields: [attributeId], references: [id])

  @@map("attribute_options")
  @@unique([attributeId, value], map: "uq_attr_option_attr_value")
  @@index([attributeId, sortOrder], map: "idx_attr_option_attr_sort")
}

// type ↔ attribute rules
model ProductTypeAttribute {
  productTypeId String @map("product_type_id")
  attributeId   String @map("attribute_id")

  isRequired    Boolean @default(false) @map("is_required")
  isFilterable  Boolean @default(false) @map("is_filterable")

  // If true: attribute is a variant axis for this type
  isVariantAxis Boolean @default(false) @map("is_variant_axis")
  variantAxisOrder Int? @map("variant_axis_order")

  createdAt     DateTime @default(now(3)) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  productType   ProductType         @relation(fields: [productTypeId], references: [id])
  attribute     AttributeDefinition @relation(fields: [attributeId], references: [id])

  @@id([productTypeId, attributeId])
  @@map("product_type_attributes")
  @@index([productTypeId, isVariantAxis, variantAxisOrder], map: "idx_pta_type_variant_axis")
}

// =========================
// ATTRIBUTE VALUES (PRODUCT)
// =========================

model ProductAttributeValue {
  id          String   @id @default(uuid())
  productId   String   @map("product_id")
  attributeId String   @map("attribute_id")

  // typed columns (one-of)
  textValue   String?  @map("text_value")
  numberValue Decimal? @db.Decimal(18, 4) @map("number_value")
  booleanValue Boolean? @map("boolean_value")
  dateValue   DateTime? @map("date_value")

  // for SELECT
  optionId    String?  @map("option_id")

  createdAt   DateTime @default(now(3)) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  product     Product              @relation(fields: [productId], references: [id])
  attribute   AttributeDefinition  @relation(fields: [attributeId], references: [id])
  option      AttributeOption?     @relation(fields: [optionId], references: [id])

  multiSelectOptions ProductAttributeValueOption[]

  @@map("product_attribute_values")
  @@unique([productId, attributeId], map: "uq_pav_product_attribute")
  @@index([attributeId, optionId], map: "idx_pav_attr_option")
}

model ProductAttributeValueOption {
  productAttributeValueId String @map("product_attribute_value_id")
  optionId                String @map("option_id")

  value   ProductAttributeValue @relation(fields: [productAttributeValueId], references: [id])
  option  AttributeOption       @relation(fields: [optionId], references: [id])

  @@id([productAttributeValueId, optionId])
  @@map("product_attribute_value_options")
  @@index([optionId], map: "idx_pavopt_option")
}

// =========================
// ATTRIBUTE VALUES (VARIANT)
// =========================

model VariantAttributeValue {
  id          String   @id @default(uuid())
  variantId   String   @map("variant_id")
  attributeId String   @map("attribute_id")

  // typed columns (one-of)
  textValue   String?  @map("text_value")
  numberValue Decimal? @db.Decimal(18, 4) @map("number_value")
  booleanValue Boolean? @map("boolean_value")
  dateValue   DateTime? @map("date_value")

  // for SELECT
  optionId    String?  @map("option_id")

  createdAt   DateTime @default(now(3)) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  variant     ProductVariant       @relation(fields: [variantId], references: [id])
  attribute   AttributeDefinition  @relation(fields: [attributeId], references: [id])
  option      AttributeOption?     @relation(fields: [optionId], references: [id])

  multiSelectOptions VariantAttributeValueOption[]

  @@map("variant_attribute_values")
  @@unique([variantId, attributeId], map: "uq_vav_variant_attribute")
  @@index([attributeId, optionId], map: "idx_vav_attr_option")
}

model VariantAttributeValueOption {
  variantAttributeValueId String @map("variant_attribute_value_id")
  optionId                String @map("option_id")

  value   VariantAttributeValue @relation(fields: [variantAttributeValueId], references: [id])
  option  AttributeOption       @relation(fields: [optionId], references: [id])

  @@id([variantAttributeValueId, optionId])
  @@map("variant_attribute_value_options")
  @@index([optionId], map: "idx_vavopt_option")
}
```

### Notes quan trọng về “đầy đủ & clean”

- Schema trên tập trung **catalog domain**; phần Orders/Payments/Users… tách module riêng.
- `CategoryClosure` là optional. Nếu bạn chưa có nhu cầu query subtree/breadcrumb hiệu năng cao, có thể bỏ.

---

## 5) Best practices & lưu ý kỹ thuật (thực chiến)

### 5.1 Có nên dùng JSON không?

- Có thể dùng JSON cho:
  - snapshot “raw import payload”, hoặc metadata không cần filter/search (ví dụ `externalRefs`)
  - log/audit payload
- **Không dùng JSON làm trung tâm thuộc tính** nếu bạn cần filter/facet theo màu/size/chất liệu…

### 5.2 Chống trùng variant (cốt lõi)

DB không thể tự hiểu “combination” từ nhiều dòng attribute value, nên cách thực chiến là:

- Service build `optionKey` canonical theo `variantAxisOrder`
  - ví dụ: `color=red|size=m` (luôn sort theo axis order)
- `@@unique([productId, optionKey])` chặn trùng variant

Service rules:

- Mỗi `ProductVariant` phải có đầy đủ axis values nếu type có axis
- `optionKey` phải match 100% axis set (không thiếu, không thừa)

Lưu ý nếu bạn là **marketplace/multi-tenant** (nhiều shop):

- Các unique như `Product.slug`, `ProductVariant.sku`, `ProductVariant (productId, optionKey)` nên đổi thành unique theo `shopId`/`storeId`.
  - Ví dụ: `@@unique([storeId, sku])`, `@@unique([storeId, slug])`.
  - Nếu bạn chắc chắn chỉ có 1 shop (single-tenant) thì giữ unique global cho đơn giản.

### 5.3 Tồn kho đúng hơn: `stockOnHand` & `stockReserved`

- `availableToSell = stockOnHand - stockReserved`
- Khi tạo đơn: tăng `stockReserved`
- Khi thanh toán/fulfill: giảm `stockOnHand` và giảm `stockReserved`

Nếu đi xa hơn:

- Tách `InventoryLedger` để audit “vì sao kho thay đổi” (điều chỉnh, hoàn hàng, hủy đơn)

### 5.4 Xử lý `basePrice`

- Source of truth: `ProductVariant.price`
- `Product.minPrice/maxPrice` là cache:
  - cập nhật khi variants thay đổi (transaction hoặc background job)

### 5.5 Ảnh chính / ảnh variant

- `ProductImage.isPrimary` và `VariantImage.isPrimary`
- Rule service: mỗi product/variant chỉ có 1 ảnh primary (DB khó enforce tuyệt đối; enforce ở service)

### 5.6 Validate consistency ảnh (product vs variant)

- Vì đã tách 2 bảng ảnh, bạn không cần rule “productId vs variantId” trong cùng 1 record.

### 5.7 Soft delete hợp lý (và vấn đề unique)

Vấn đề thực tế:

- Nếu bạn soft delete mà vẫn giữ `sku`/`slug`/`optionKey` unique, bạn sẽ không thể tạo bản ghi mới có cùng giá trị.

Giải pháp thực chiến khuyến nghị:

- Vẫn giữ unique index “sạch” (không include `deletedAt`)
- Khi soft delete, service **rewrite các unique fields**:
  - `sku = sku + "~deleted~" + id`
  - `slug = slug + "~deleted~" + id`
  - `optionKey = optionKey + "~deleted~" + id`

### 5.9 Chặn dữ liệu bẩn: những chỗ DB không chặn hết

Một số rule **khó enforce tuyệt đối bằng DB** (đặc biệt với MySQL + Prisma), nên bắt buộc validate ở service:

- **Typed columns (one-of)**: `ProductAttributeValue`/`VariantAttributeValue` có nhiều cột (`textValue`, `numberValue`, `optionId`...). DB thường không đảm bảo “chỉ được set đúng 1 cột” cho mỗi record.
  - Rule service: dựa vào `AttributeDefinition.dataType` để chỉ cho phép 1 trường hợp hợp lệ.
- `SELECT`/`MULTI_SELECT`: `optionId` phải thuộc đúng `AttributeDefinition` (tức `AttributeOption.attributeId == attributeId`). DB khó làm FK cross-check kiểu này; validate ở service.
- `isPrimary` image: DB khó enforce “mỗi product/variant chỉ 1 primary” nếu không dùng constraint phức tạp; enforce ở service.
- `ProductCategory.isPrimary`: enforce “mỗi product chỉ 1 primary category” ở service.

### 5.8 Indexing cho filter/facet

- Filter theo option: index `(attributeId, optionId)` ở bảng value
- Query variants theo product: index `(productId, status)`
- Category tree: index `(parentId, sortOrder)` và optional closure table

---

## 6) Trade-off

### Ưu điểm

- Mở rộng loại sản phẩm/thuộc tính **không đổi schema**
- Dữ liệu sạch hơn: attribute có definition + option, giảm “bừa”
- Filter/facet dễ và tối ưu index được
- Variant management chuẩn: SKU/price/stock ở variant

### Nhược điểm / độ phức tạp

- Nhiều bảng hơn, join nhiều hơn
- Cần service layer nghiêm: build `optionKey`, validate axis completeness
- Admin UI cần làm tốt trải nghiệm nhập thuộc tính

### Khi nào nên chọn bản rút gọn

- Nếu chỉ bán 1-2 loại sản phẩm và attribute rất ít, bạn có thể:
  - vẫn giữ `ProductType` + `ProductVariant`
  - attribute system giữ lại nhưng giới hạn `SELECT` + `TEXT`
- Nhưng nếu mục tiêu “đi đường dài” (đúng như bạn nói), mình **không khuyến nghị** quay về JSON-centric.

---

## 7) Khuyến nghị cuối cùng (chốt phương án)

Nếu mục tiêu là “đi đường dài”, nên dùng đúng mô hình trên.

### Bắt buộc (core)

- `ProductType`, `Product`, `ProductVariant`
- `Category`, `ProductCategory`
- `AttributeDefinition`, `ProductTypeAttribute`, `AttributeOption`
- `ProductAttributeValue`, `VariantAttributeValue`
- `ProductImage`, `VariantImage`

### Optional (nâng cấp theo giai đoạn)

- `CategoryClosure` (khi cần subtree query nhanh)
- Inventory ledger/multi-warehouse
- Price lists/promotions engine

---

## Ví dụ thực tế (đúng theo nghiệp vụ bạn đưa)

### Ví dụ A: Áo có màu + size (variant)

- `ProductType`: `ao`
- Attributes:
  - `color` (VARIANT, SELECT, isVariantAxis=true, order=1)
  - `size` (VARIANT, SELECT, isVariantAxis=true, order=2)
  - `material` (PRODUCT, SELECT/TEXT)
- Variants:
  - SKU: `AO-TS-RED-M`, optionKey: `color=red|size=m`, price/stock riêng
  - SKU: `AO-TS-RED-L`, optionKey: `color=red|size=l`

### Ví dụ B: Vòng tay không có nhiều variant

- Vẫn tạo **1 variant default**:
  - optionKey: `default`
- Product attributes:
  - `bracelet_material` (PRODUCT)
  - `bracelet_diameter_mm` (PRODUCT, NUMBER)
  - `stone_type` (PRODUCT, SELECT)

### Ví dụ C: Mũ có màu + size + style

- Axes:
  - `color` (VARIANT)
  - `size` (VARIANT)
  - `hat_style` (VARIANT)
- optionKey: `color=black|size=m|hat_style=dad_hat`

---

## Checklist validate ở tầng service (bắt buộc)

- Khi tạo/sửa product:
  - productTypeId tồn tại
  - attributes phải nằm trong `ProductTypeAttribute`
  - dataType đúng (number không nhận text…)
- Khi tạo/sửa variant:
  - phải có đủ các `isVariantAxis=true`
  - optionId phải thuộc đúng attributeId
  - build optionKey canonical + check unique
- Khi publish product:
  - có ít nhất 1 variant ACTIVE
  - có ảnh primary (tuỳ rule vận hành)

---

Nếu bạn muốn, bước tiếp theo mình có thể làm luôn:

1. So sánh schema hiện tại trong project với schema đề xuất này
2. Đưa ra plan migration (Prisma migrate) ít downtime nhất
3. Mapping data cũ (đặc biệt nếu đang lưu JSON attributes) sang hệ thống mới
