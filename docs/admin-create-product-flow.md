# Flow Admin Create Product (hiện tại)

Tài liệu này mô tả flow **tạo sản phẩm** ở trang admin (client-seller) theo hệ thống catalog mới (chuẩn hoá Attribute + `optionKey`), bao gồm: UI validation, upload ảnh, payload API, và xử lý phía server.

## 1) Mục tiêu & các ràng buộc quan trọng

### 1.1. Category bắt buộc (để gán `productTypeId`)

- Khi tạo product, admin **phải chọn danh mục**.
- Server sẽ tự gán `product.productTypeId` dựa trên **root category slug** (mapping theo code).

### 1.2. `optionKey` phải duy nhất trên mỗi product

- Mỗi variant có `attributes` (JSON).
- Server tạo `product_variants.option_key` từ `attributes` theo hàm canonicalization.
- Nếu `attributes` không có thuộc tính nào có giá trị (ví dụ sản phẩm **không có color/size** và không dùng thuộc tính khác), `optionKey` sẽ **fallback theo SKU** dạng `sku=<SKU>` để vẫn đảm bảo unique.
- DB có unique index: **(product_id, option_key)** ⇒ 2 variants có cùng combination thuộc tính sẽ bị lỗi.
- UI hiện tại chủ động validate **trùng optionKey** trước khi submit để tránh dính unique constraint.

### 1.3. Axis attributes `color` và `size`

- `color` và `size` là các axis phổ biến, nhưng **axis attributes thực tế được quyết định theo `productType`** của category đã chọn.
- Client gọi `GET /api/common/product-type-schema?categoryId=...` để lấy danh sách `variantAxisAttributes` và render input tương ứng.
- Server sẽ sync từ legacy `variant.attributes.<axisCode>` → bảng chuẩn hoá `VariantAttributeValue` (và upsert `AttributeOption`) cho các axis đang được hỗ trợ (hiện có `color/size`).
- UI không cho phần “Thuộc tính khác” dùng key reserved/axis (tránh đụng schema).
- Khi submit, client sẽ **lọc bỏ các attribute rỗng** (ví dụ `color: ""`, `size: ""`) trước khi gửi lên API để tránh lưu dữ liệu rỗng vào DB.

### 1.4. Ảnh sản phẩm (main image)

- UI hiện tại chỉ cho **1 ảnh chính của product** (replace ảnh cũ nếu upload mới).
- Payload vẫn gửi `images[]` với trường `isPrimary` (ảnh index 0 sẽ là primary).

## 2) UI flow (client-seller)

### 2.1. Màn hình & thành phần

- Trang: `/products/create`
- Main form: nhập thông tin chung + variants + ảnh
- Sidebar: chọn category theo cấp, tag, và nút submit

### 2.2. Input & rules

**Thông tin chung**

- `name` (bắt buộc, non-empty)
- `basePrice` (bắt buộc, > 0 tại UI)
- `description` (tuỳ chọn)

**Category**

- Chọn category theo dropdown nhiều cấp.
- Khi root/group có children thì bắt buộc chọn xuống đến leaf (hoặc group/root nếu node đó không có children).
- UI chặn submit nếu chưa có `categoryId`.

**Variants**

- Tối thiểu 1 variant.
- Mỗi variant có:
  - `sku` (nếu bỏ trống UI sẽ generate theo tên + id tạm)
  - `price` (fallback về `basePrice` nếu trống)
  - `stockAvailable`, `minStock` (UI yêu cầu >= 0)
  - `attributes`:
    - `color`, `size` (axis inputs)
    - các thuộc tính khác: key/value tuỳ chọn, nhưng **không được dùng key `color` hoặc `size`**

**Không trùng optionKey**

- Trước submit, UI tạo `optionKey` từ `variant.attributes` theo rule:
  - Loại bỏ key rỗng, value rỗng/null/undefined
  - Trim string
  - Sort theo key
  - Join dạng `key=value|key2=value2`
- Nếu 2 variants trùng `optionKey` ⇒ UI báo lỗi và không submit.

### 2.3. Upload ảnh

UI upload theo 2 nhóm:

- Ảnh product (main): chỉ 1 ảnh
- Ảnh variant: nhiều ảnh theo từng variant

Quy trình upload 1 ảnh:

1. Gọi server xin chữ ký Cloudinary
2. Upload trực tiếp lên Cloudinary để lấy `secure_url`

## 3) API calls (client-seller → server)

### 3.1. Load dữ liệu form

- `GET /common/categories` (đổ dropdown category)
- `GET /common/tags` (đổ dropdown tag)

### 3.2. Upload ảnh

- `POST /admin/cloudinary/sign` để lấy signature upload
- `POST https://api.cloudinary.com/v1_1/<cloudName>/image/upload` (upload trực tiếp)

### 3.3. Create product

- `POST /admin/products`

Payload (rút gọn):

```json
{
  "name": "...",
  "description": "...",
  "basePrice": 123,
  "images": [
    {
      "url": "https://...",
      "altText": "...",
      "sortOrder": 0,
      "isPrimary": true
    }
  ],
  "variants": [
    {
      "sku": "SKU-001",
      "attributes": { "color": "Đỏ", "size": "L", "chat_lieu": "cotton" },
      "price": 123,
      "stockAvailable": 10,
      "minStock": 0,
      "images": [{ "url": "https://...", "altText": "...", "sortOrder": 0 }]
    }
  ],
  "categoryIds": ["<categoryId>"],
  "tagIds": ["<tagId>"]
}
```

## 4) Server flow (transaction)

### 4.1. Validate cơ bản (UseCase)

- Validate `name`, `basePrice >= 0`, có `variants[]`.
- Check duplicate SKU (tồn tại trong DB) ⇒ báo lỗi.

### 4.2. Lưu product + variants + images + links (Repository)

Toàn bộ chạy trong 1 transaction:

1. Validate `categoryIds` tồn tại (nếu gửi lên)
2. Validate `tagIds` tồn tại (nếu gửi lên)
3. Resolve `productTypeId` từ categoryIds:
   - Lấy root category slug bằng cách đi ngược parentId
   - Map slug → type code:
     - `ao` → `ao`
     - `quan` → `quan`
     - `vong-tay`/`vong_tay` → `vong_tay`
     - còn lại → `phu_kien`
   - Find `productType` theo code, fallback `phu_kien`
4. Create `product` (gắn `productTypeId` nếu resolve được)
5. Create variants:
   - Set `optionKey = buildVariantOptionKeyFromAttributes(attributes)`
   - Set tồn kho `stockOnHand = stockAvailable`
6. Sync axis attributes (color/size):
   - Tìm `AttributeDefinition` có code `color`, `size`
   - Normalize `value` để tạo `AttributeOption.value` (ASCII + lower + underscore)
   - Upsert `AttributeOption` và upsert `VariantAttributeValue`
   - Nếu axis value rỗng ⇒ xoá `VariantAttributeValue` tương ứng
7. Create images:
   - Product images: `productId`, `variantId = null`
   - Variant images: map theo sku để gắn `variantId`
8. Link categories (`productCategory`) + tags (`productTag`)

## 5) Các lỗi hay gặp & cách xử lý

- **Chưa chọn category**: UI chặn submit.
- **Trùng combination thuộc tính (trùng optionKey)**: UI chặn submit; nếu vẫn lọt ⇒ DB unique constraint `(product_id, option_key)`.
- **SKU đã tồn tại**: server trả lỗi `ProductAlreadyExistsError`.
- **Category/Tag không tồn tại**: server throw error `Categories not found: ...` / `Tags not found: ...`.
- **Upload ảnh fail**: UI báo lỗi và dừng tạo sản phẩm.

## 6) Nguồn code tham chiếu

- Client create page: `client-seller/src/page/product/create-product.tsx`
- Client form inputs: `client-seller/src/components/admin/product-form.tsx`
- Client sidebar category/tags: `client-seller/src/components/admin/product-sidebar.tsx`
- Server create usecase: `server/src/module/admin/products/applications/usecases/create-product.usecase.ts`
- Server save transaction: `server/src/module/admin/products/infrastructure/repositories/prisma-product.repository.ts`
- Canonicalize optionKey: `server/src/shared/util/variant-option-key.ts`
