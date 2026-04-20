# Product Organization Overview

Tài liệu này mô tả một sản phẩm được tổ chức như thế nào trong dự án hiện tại: từ database, backend module, admin flow, đến storefront flow.

## 1. Mục tiêu mô hình Product

Hệ thống tổ chức product theo hướng:

- Product giữ thông tin cấp sản phẩm (tên, giá nền, trạng thái, liên kết danh mục/tag).
- Variant giữ thông tin bán thực tế (SKU, tổ hợp thuộc tính, tồn kho, giá).
- Attribute system cho phép mở rộng thuộc tính theo ProductType (động theo loại sản phẩm).
- Tách Admin API và Public API thành 2 module độc lập.

## 2. Cấu trúc dữ liệu chính trong database

Nguồn tham chiếu:

- server/prisma/schema.prisma

### 2.1. Bảng products

Thông tin chính:

- id
- product_type_id
- name
- description
- base_price
- status, is_new, is_sale
- is_deleted, deleted_at
- created_at, updated_at

Quan hệ:

- 1-N với product_variants
- 1-N với product_images
- N-N với categories qua product_categories
- N-N với tags qua product_tags
- 1-N với product_attribute_values

### 2.2. Bảng product_variants

Thông tin chính:

- id
- product_id
- sku (unique toàn hệ thống)
- option_key (unique theo cặp product_id + option_key)
- attributes (JSON legacy)
- price
- stock_available, stock_on_hand, stock_reserved, min_stock
- is_deleted, deleted_at

Ý nghĩa:

- Giá bán thực tế nằm ở variant.
- option_key là khóa chuẩn hóa tổ hợp thuộc tính (ví dụ color=red|size=m) để chống trùng biến thể.

### 2.3. Bảng product_images

Thông tin chính:

- id
- product_id
- variant_id (nullable)
- url, alt_text, sort_order, is_primary

Ý nghĩa:

- variant_id null: ảnh cấp product.
- variant_id có giá trị: ảnh cấp variant.

### 2.4. Hệ thuộc tính động

Nhóm bảng:

- product_types
- attribute_definitions
- attribute_options
- product_type_attributes
- product_attribute_values (+ product_attribute_value_options)
- variant_attribute_values (+ variant_attribute_value_options)

Ý nghĩa:

- ProductType quyết định bộ thuộc tính nào áp dụng cho product.
- Thuộc tính có data type: TEXT, NUMBER, BOOLEAN, DATE, SELECT, MULTI_SELECT.
- color/size đang được đồng bộ từ JSON attributes sang variant_attribute_values.

## 3. Cách tổ chức code theo module

## 3.1. Admin Product Module

Thư mục:

- server/src/module/admin/products

Tổ chức:

- applications: usecase, dto, ports
- entities: domain entity
- infrastructure: api + prisma repositories
- interface-adapter: controller
- di.ts: wiring dependency

API chính (admin):

- GET /products
- GET /products/:id
- POST /products
- PUT /products/:id
- DELETE /products/:id
- POST /products/:id/restore
- POST /products/bulk-delete

File tham chiếu:

- server/src/module/admin/products/infrastructure/api/product.api.ts
- server/src/module/admin/products/di.ts

## 3.2. Public Product Module

Thư mục:

- server/src/module/product

API chính (public):

- GET /
- GET /:id
- GET /categories/stats
- GET /category-showcases
- GET /favorites
- POST /:id/favorite
- DELETE /:id/favorite
- GET /related/my-orders

File tham chiếu:

- server/src/module/product/infrastructure/api/product.api.ts
- server/src/module/product/di.ts

## 4. Contract dữ liệu của một Product

## 4.1. Admin create payload

Theo DTO create:

- name
- basePrice
- variants[]
- images[]
- categoryIds[]
- tagIds[]
- productAttributes[]

File tham chiếu:

- server/src/module/admin/products/applications/dto/command/create-product.command.ts
- client-seller/src/page/product/create-product.tsx

## 4.2. Admin detail output

Theo DTO admin detail:

- id, name, basePrice, status
- variants[]
- images[]
- categories[]
- tags[]
- productAttributes[]
- stats

File tham chiếu:

- server/src/module/admin/products/applications/dto/command/get-product-detail.command.ts

## 4.3. Public detail output

Theo DTO public detail:

- id, name, description, basePrice
- images[]
- variants[]
- categories[]
- tags[]
- productAttributes[]
- reviews + reviewItems

File tham chiếu:

- server/src/module/product/applications/dto/result/product-detail.result.ts
- server/src/module/product/applications/usecases/get-product-detail.usecase.ts

## 5. Luồng tạo 1 sản phẩm (admin)

## 5.1. Client-seller

Trang tạo product:

- client-seller/src/page/product/create-product.tsx

Luồng chính:

1. Nhập dữ liệu cơ bản + variant + ảnh.
2. Lấy schema theo category qua common product-type-schema để biết axis attributes.
3. Upload ảnh lên Cloudinary (qua chữ ký backend).
4. Chuẩn hóa attributes và validate trùng option key ở client.
5. Gọi POST /admin/products với payload hoàn chỉnh.

Các productAttributes đang được đẩy lên:

- usage_occasions
- target_age_group
- product_story
- care_instruction
- fit_note
- size_guide_image_url (nếu có)

## 5.2. Backend admin

Usecase + repository:

- validate command
- kiểm tra SKU trùng
- transaction tạo product, variants, images, category/tag link, product attributes
- resolve productType từ root category slug
- sync color/size sang variant_attribute_values

File tham chiếu:

- server/src/module/admin/products/applications/usecases/create-product.usecase.ts
- server/src/module/admin/products/infrastructure/repositories/prisma-product.repository.ts

## 6. Luồng đọc 1 sản phẩm (public)

1. Client-next gọi service getProductDetail(id).
2. Public API trả data từ usecase get-product-detail.
3. UI render ảnh/variants/thuộc tính/review.

File tham chiếu:

- client-next/services/product.service.ts
- client-next/hooks/use-product-detail.ts
- client-next/components/page/product/product-detail-content.tsx

## 7. Quy tắc tổ hợp variant (option_key)

File chuẩn hóa:

- server/src/shared/util/variant-option-key.ts

Quy tắc:

- Bỏ key rỗng, value rỗng/null/undefined.
- Trim key/value.
- Sort theo key để canonical.
- Join dạng key=value|key2=value2.
- Nếu không còn thuộc tính hợp lệ thì fallback sku=<SKU> hoặc default.

Mục tiêu:

- Chống tạo 2 variant có cùng tổ hợp thuộc tính trong cùng product.

## 8. Cách project map Category -> ProductType

Nguồn:

- server/src/module/admin/products/infrastructure/repositories/prisma-product.repository.ts
- server/src/module/common/infrastructure/repositories/prisma-product-type-schema.repository.ts

Cơ chế hiện tại:

- Đi lên root category bằng parentId.
- Map root slug sang product type code (ao, quan, vay/phu_kien...).
- Gán productTypeId khi tạo product.

## 9. Lưu ý hiện trạng

1. DB vẫn còn cột products.description và public DTO vẫn trả description.
2. Admin flow hiện đã bỏ SEO fields ở UI/API create-update, và API có lọc bỏ seo_title/seo_description/seo_keywords nếu client cũ gửi lên.
3. Public UI vẫn có logic đọc SEO attribute code từ productAttributes; nếu DB đã xóa các attribute SEO thì các block SEO chỉ không hiển thị, không lỗi.

## 10. Danh sách file quan trọng để onboard nhanh

Database:

- server/prisma/schema.prisma

Admin backend:

- server/src/module/admin/products/di.ts
- server/src/module/admin/products/infrastructure/api/product.api.ts
- server/src/module/admin/products/applications/usecases/create-product.usecase.ts
- server/src/module/admin/products/infrastructure/repositories/prisma-product.repository.ts

Public backend:

- server/src/module/product/di.ts
- server/src/module/product/infrastructure/api/product.api.ts
- server/src/module/product/applications/usecases/get-products.usecase.ts
- server/src/module/product/applications/usecases/get-product-detail.usecase.ts
- server/src/module/product/infrastructure/repositories/prisma-product.repository.ts

Admin frontend:

- client-seller/src/page/product/create-product.tsx
- client-seller/src/components/admin/product-form.tsx
- client-seller/src/components/admin/product-sidebar.tsx
- client-seller/src/types/api.ts

Storefront frontend:

- client-next/services/product.service.ts
- client-next/hooks/use-product-detail.ts
- client-next/components/page/product/product-detail-content.tsx
- client-next/types/product/index.tsx
