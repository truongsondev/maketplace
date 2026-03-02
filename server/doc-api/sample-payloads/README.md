# Sample Payloads - Create Product API

Các file payload mẫu để test API tạo sản phẩm.

## 📁 Danh sách file

### 1. `create-product-minimal.json`

Payload tối thiểu với các trường bắt buộc:

- ✅ 1 variant đơn giản
- ❌ Không có hình ảnh
- ❌ Không có categories/tags

**Use case**: Test nhanh, tạo sản phẩm đơn giản

### 2. `create-product-complete.json`

Payload đầy đủ với tất cả các trường:

- ✅ Nhiều variants (4 variants: 2 màu x 2 size)
- ✅ Nhiều hình ảnh (có link đến variants)
- ✅ Categories và tags
- ✅ Mô tả chi tiết

**Use case**: Test đầy đủ tính năng, sản phẩm thời trang

### 3. `create-product-shoes.json`

Sản phẩm giày với nhiều size và màu:

- ✅ 6 variants (2 màu x 3 size)
- ✅ Hình ảnh theo màu
- ✅ Giá cao hơn

**Use case**: Sản phẩm có nhiều biến thể

### 4. `create-product-electronics.json`

Sản phẩm điện tử:

- ✅ 3 variants (chỉ khác màu)
- ✅ Variants có giá khác nhau
- ✅ Mô tả kỹ thuật

**Use case**: Sản phẩm công nghệ

## 🚀 Cách sử dụng

### Với cURL:

```bash
curl -X POST http://localhost:8080/api/admin/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @create-product-minimal.json
```

### Với PowerShell:

```powershell
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer YOUR_TOKEN"
}

$body = Get-Content create-product-minimal.json -Raw

Invoke-RestMethod -Uri "http://localhost:8080/api/admin/products" `
    -Method POST `
    -Headers $headers `
    -Body $body
```

### Với REST Client (VS Code Extension):

```http
POST http://localhost:8080/api/admin/products
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

< ./create-product-minimal.json
```

## 📋 Cấu trúc Payload

```typescript
{
  // BẮT BUỘC
  "name": string,              // Tên sản phẩm
  "basePrice": number,         // Giá cơ bản
  "variants": [                // Ít nhất 1 variant
    {
      "sku": string,           // Mã SKU duy nhất
      "attributes": object,    // Thuộc tính (color, size, etc.)
      "price": number,         // Giá bán
      "stockAvailable": number // Số lượng tồn kho
    }
  ],

  // TÙY CHỌN
  "description": string,       // Mô tả sản phẩm
  "images": [                  // Hình ảnh sản phẩm
    {
      "url": string,           // URL hình ảnh
      "altText": string,       // Mô tả alt
      "sortOrder": number,     // Thứ tự hiển thị
      "isPrimary": boolean,    // Ảnh chính?
      "variantId": string      // SKU của variant (nếu có)
    }
  ],
  "categoryIds": string[],     // IDs danh mục
  "tagIds": string[]           // IDs thẻ tag
}
```

## ⚠️ Lưu ý

1. **SKU phải duy nhất**: Mỗi SKU trong hệ thống chỉ tồn tại 1 lần
2. **CategoryIds và TagIds**: Phải tồn tại trong database trước khi tạo sản phẩm
3. **variantId trong images**: Phải match với SKU của một variant
4. **Giá**: Phải là số dương (>= 0)
5. **Stock**: Phải là số nguyên dương (>= 0)

## 🔄 Response mẫu

### Success (201 Created):

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "productId": "uuid-of-created-product",
    "message": "Product created successfully"
  }
}
```

### Error (400 Bad Request):

```json
{
  "success": false,
  "message": "Product name must be a non-empty string",
  "error": {
    "code": "BAD_REQUEST",
    "details": null
  }
}
```

### Error (409 Conflict - Duplicate SKU):

```json
{
  "success": false,
  "message": "Product with SKU \"TSHIRT-001-M\" already exists",
  "error": {
    "code": "CONFLICT",
    "details": null
  }
}
```

## 🧪 Testing Checklist

- [ ] Test với minimal payload
- [ ] Test với complete payload
- [ ] Test với SKU trùng (expect 409)
- [ ] Test với giá âm (expect 400)
- [ ] Test với variants rỗng (expect 400)
- [ ] Test với name rỗng (expect 400)
- [ ] Test với categoryIds không tồn tại
- [ ] Test với variantId không match SKU

## 📝 Customize Payload

Để tạo payload riêng, copy một trong các file mẫu và chỉnh sửa:

1. Đổi tên sản phẩm và mô tả
2. Thay đổi SKU (phải unique)
3. Điều chỉnh giá cả
4. Thêm/bớt variants theo nhu cầu
5. Cập nhật URLs hình ảnh
6. Thay đổi categoryIds và tagIds

## 🔗 Tài liệu liên quan

- [API Documentation](../create-product.md)
- [Module Architecture](../../src/module/admin/ARCHITECTURE.md)
- [Quick Start Guide](../../src/module/admin/QUICK_START.md)
