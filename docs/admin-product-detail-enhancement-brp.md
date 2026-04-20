# BUSINESS REQUIREMENT DOCUMENT (BRP) - BỔ SUNG THÔNG TIN CHI TIẾT SẢN PHẨM

## 1. Business Objective

Nâng cấp dữ liệu và trải nghiệm tạo sản phẩm trong trang Admin để sản phẩm có thông tin phong phú, rõ ràng, nổi bật hơn, giúp:

- Tăng tỷ lệ chuyển đổi (CVR) ở trang chi tiết sản phẩm.
- Giảm câu hỏi lặp lại từ khách hàng do thiếu thông tin (chất liệu, form, hướng dẫn bảo quản, kích cỡ...).
- Chuẩn hóa dữ liệu catalog để hỗ trợ filter, SEO, gợi ý sản phẩm và vận hành nội bộ.

## 2. Context & Current State

### 2.1 Nhu cầu nghiệp vụ

Hiện tại thông tin sản phẩm chủ yếu dừng ở mức cơ bản (tên, mô tả ngắn, giá, biến thể, ảnh), chưa đủ để làm nổi bật và làm rõ sản phẩm.

### 2.2 Hiện trạng hệ thống (đã rà `schema.prisma`)

- Đã có nền tảng catalog tốt:
  - `Product`, `ProductVariant`, `ProductImage`, `Category`, `ProductCategory`, `Tag`, `ProductTag`.
  - Hệ attribute chuẩn hóa: `AttributeDefinition`, `AttributeOption`, `ProductTypeAttribute`, `ProductAttributeValue`, `VariantAttributeValue`.
- Trang tạo sản phẩm (`client-seller`) hiện submit các trường chính:
  - `name`, `description`, `basePrice`, `images`, `variants`, `categoryIds`, `tagIds`.
- Khoảng trống hiện tại:
  - Chưa có section nhập thông tin sản phẩm chi tiết ở cấp Product (specs, USP, care instructions, size guide, SEO content).
  - Chưa tận dụng đầy đủ `ProductAttributeValue` cho phần nội dung chi tiết có cấu trúc.
  - Payload tạo sản phẩm chưa nhận `productAttributes`.

## 3. Scope

### 3.1 In Scope

- Thiết kế và triển khai bộ thông tin chi tiết sản phẩm ở cấp Product.
- Mở rộng màn hình tạo sản phẩm Admin với các section thông tin mới.
- Mở rộng API tạo/cập nhật sản phẩm để lưu dữ liệu chi tiết.
- Hiển thị thông tin chi tiết trên trang Product Detail phía client-next.
- Chuẩn hóa dữ liệu theo Product Type.

### 3.2 Out of Scope

- Thay đổi logic pricing/khuyến mãi.
- Thiết kế lại toàn bộ PDP (chỉ bổ sung block nội dung chi tiết).
- Tự động sinh nội dung bằng AI (có thể làm phase sau).

## 4. Proposed Solution (Business + System)

## 4.1 Nguyên tắc thiết kế

- Ưu tiên tái sử dụng mô hình attribute hiện có (`ProductAttributeValue`) thay vì thêm quá nhiều cột cứng vào `Product`.
- Dữ liệu phải có thể:
  - Hiển thị đẹp trên PDP.
  - Dùng làm filter/search trong tương lai.
  - Dễ validate theo từng loại sản phẩm.

## 4.2 Bộ thông tin chi tiết đề xuất

### A. Product Story (nội dung marketing)

- Điểm nổi bật (USP): 3-6 bullet.
- Mô tả chi tiết mở rộng.
- Hướng dẫn sử dụng/bảo quản.

### B. Product Specs (nội dung kỹ thuật có cấu trúc)

- Chất liệu chính.
- Kiểu dáng/form.
- Độ co giãn/độ dày.
- Xuất xứ.
- Mùa phù hợp/hoàn cảnh sử dụng.

### C. Occasion & Lifestyle Fit (mục đích sử dụng)

- Mục đích phù hợp (multi-select), ví dụ:
  - Đi làm
  - Đi chơi
  - Tập thể thao
  - Ở nhà

### D. Age Fit (độ tuổi phù hợp)

- Nhóm tuổi phù hợp (single-select hoặc multi-select theo quyết định business), ví dụ:
  - 10-15
  - 16-25
  - 25-30
  - > 30

### E. Size & Fit

- Fit note (ví dụ: form rộng/regular/slim).
- Size guide (table hoặc ảnh hướng dẫn size).

### F. SEO & Merchandising

- SEO title.
- SEO description.
- SEO keywords.
- Badge nổi bật (New, Best Seller, Limited...).

## 4.3 Chiến lược lưu trữ dữ liệu

### Giai đoạn 1 (khuyến nghị triển khai ngay)

Tái sử dụng `AttributeDefinition` + `ProductTypeAttribute` + `ProductAttributeValue`:

- Tạo thêm các `AttributeDefinition` scope `PRODUCT` cho bộ thông tin chi tiết.
- Mapping attribute theo `ProductType` để mỗi loại hàng có form phù hợp.
- Lưu giá trị vào `ProductAttributeValue` (text/number/boolean/option/multi-option).

Lợi ích:

- Không phá vỡ schema hiện tại.
- Dễ mở rộng theo category/product type.
- Giảm chi phí migration.

### Giai đoạn 2 (tùy chọn, khi cần nâng cao nội dung)

- Cân nhắc thêm bảng nội dung chuyên biệt nếu cần:
  - `product_content_blocks` (rich content nhiều block).
  - `product_size_guides` (table size chuẩn hóa).
  - `product_seo` (nếu muốn tách riêng khỏi attribute).

## 5. Actors

- Admin/Seller: tạo và cập nhật thông tin sản phẩm chi tiết.
- Customer: xem thông tin chi tiết tại PDP để ra quyết định mua.
- System (Backend + DB): validate, lưu trữ, trả dữ liệu đúng schema.
- Search/Recommendation services (tương lai): tận dụng metadata chi tiết.

## 6. Business Flow

1. Admin vào trang Create Product.
2. Admin chọn category -> hệ thống resolve `ProductType`.
3. UI gọi schema thuộc tính theo product type (`product-type-schema`) và render form chi tiết động.
4. Admin nhập thông tin cơ bản + biến thể + thông tin chi tiết.
5. Admin submit.
6. Backend validate dữ liệu cứng + dữ liệu thuộc tính theo rule.
7. Backend tạo `Product`, `ProductVariant`, `ProductImage`, links category/tag.
8. Backend upsert `ProductAttributeValue` theo payload `productAttributes`.
9. Client PDP lấy dữ liệu sản phẩm và render thêm các block “Điểm nổi bật”, “Thông số”, “Bảo quản”, “Size guide”.

## 7. Functional Requirements

- FR01: Form tạo sản phẩm phải có section “Thông tin chi tiết sản phẩm”.
- FR02: Section chi tiết phải render theo `ProductType` (khác nhau cho áo/quần/phụ kiện).
- FR03: API create/update product nhận thêm trường `productAttributes`.
- FR04: Server validate `productAttributes` theo kiểu dữ liệu của `AttributeDefinition`.
- FR05: Server lưu `productAttributes` vào `ProductAttributeValue` trong cùng transaction với tạo product.
- FR06: PDP hiển thị các block thông tin chi tiết đã lưu.
- FR07: Nếu thiếu thuộc tính bắt buộc (`isRequired=true`) thì không cho submit.
- FR08: Cho phép đánh dấu một số thuộc tính là filterable để tái sử dụng cho search/filter tương lai.
- FR09: Admin bắt buộc chọn tối thiểu 1 mục đích sử dụng sản phẩm (occasion), trừ khi loại sản phẩm được cấu hình không yêu cầu.
- FR10: Admin chọn nhóm độ tuổi phù hợp cho sản phẩm theo danh sách chuẩn đã cấu hình.
- FR11: PDP hiển thị rõ “Phù hợp cho mục đích” và “Độ tuổi phù hợp” tại khu vực thông tin chi tiết.

## 8. Non-functional Requirements

- NFR01 (Performance): Tạo sản phẩm không tăng quá 20% latency so với hiện tại.
- NFR02 (Data Quality): Không cho lưu dữ liệu sai kiểu (`number`, `boolean`, `option`, `text`).
- NFR03 (Backward Compatibility): API cũ vẫn hoạt động nếu chưa gửi `productAttributes` (optional trong phase chuyển tiếp).
- NFR04 (Observability): Có log validation fail theo mã thuộc tính để dễ debug.

## 9. Database Impact

## 9.1 Tận dụng bảng hiện có (khuyến nghị chính)

- Sử dụng các bảng đã có:
  - `attribute_definitions`
  - `product_type_attributes`
  - `product_attribute_values`
  - `product_attribute_value_options`
- Không bắt buộc thêm cột vào `products` ở giai đoạn đầu.

## 9.2 Seed/Config cần bổ sung

- Thêm seed cho các thuộc tính Product-level, ví dụ:
  - `material`
  - `fit`
  - `care_instruction`
  - `origin`
  - `usp_points`
  - `usage_occasions`
  - `target_age_group`
  - `seo_title`
  - `seo_description`
  - `season`
- Map các thuộc tính này vào từng `product_type` với:
  - `isRequired`
  - `isFilterable`
  - `variantAxis = false`

Gợi ý cấu hình option:

- `usage_occasions` (PRODUCT, dataType = MULTI_SELECT, filterable = true)
  - `di_lam` (Đi làm)
  - `di_choi` (Đi chơi)
  - `tap_the_thao` (Tập thể thao)
  - `o_nha` (Ở nhà)
- `target_age_group` (PRODUCT, dataType = SELECT, filterable = true)
  - `10_15` (10-15)
  - `16_25` (16-25)
  - `25_30` (25-30)
  - `gt_30` (>30)

## 9.3 Index/Query

- Giữ index hiện tại; theo dõi hiệu năng query PDP.
- Nếu lọc theo thuộc tính tăng mạnh, cân nhắc bổ sung index cho cặp `attribute_id + option_id` (một phần đã có), hoặc chiến lược materialized/read-model.

## 10. API Impact

## 10.1 API Create Product

`POST /admin/products`

Bổ sung payload:

```json
{
  "name": "Áo thun cotton premium",
  "description": "...",
  "basePrice": 299000,
  "categoryIds": ["..."],
  "tagIds": ["..."],
  "images": [{ "url": "...", "isPrimary": true }],
  "variants": [
    {
      "sku": "AT-001-TRANG-M",
      "attributes": { "color": "Trắng", "size": "M" },
      "price": 299000,
      "stockAvailable": 50,
      "minStock": 5,
      "images": []
    }
  ],
  "productAttributes": [
    { "code": "material", "value": "100% Cotton Compact" },
    { "code": "fit", "value": "Regular" },
    { "code": "care_instruction", "value": "Giặt máy 30 độ" },
    { "code": "usp_points", "value": ["Thoáng khí", "Ít nhăn", "Mềm mại"] },
    { "code": "usage_occasions", "value": ["di_lam", "di_choi"] },
    { "code": "target_age_group", "value": "16_25" }
  ]
}
```

## 10.2 API Product Detail

- Bổ sung response block thuộc tính chi tiết:
  - `productAttributes` đã normalize theo code/label/value/displayType.

## 11. UI/UX Impact

- Trang tạo sản phẩm Admin thêm 4 khối:
  - Thông tin cơ bản.
  - Media.
  - Variants.
  - Thông tin chi tiết sản phẩm (mới).
- Tại PDP (client-next), bổ sung tab/accordion:
  - “Điểm nổi bật”
  - “Thông số sản phẩm”
  - “Hướng dẫn bảo quản”
  - “Size & Fit”
- Có preview nhanh trong trang create để admin kiểm tra nội dung hiển thị.

## 12. Event-driven Suggestion (RabbitMQ)

Đề xuất phát event khi sản phẩm được tạo/cập nhật để đồng bộ read-model và search:

- Exchange: `catalog_events` (topic)
- Routing keys:
  - `product.created`
  - `product.updated`
  - `product.attributes.updated`
- Payload tối thiểu:

```json
{
  "productId": "uuid",
  "productTypeId": "uuid",
  "changedFields": ["productAttributes", "description"],
  "updatedAt": "2026-04-19T10:00:00Z"
}
```

Use case:

- Đồng bộ search index.
- Trigger cache invalidation PDP.
- Đồng bộ recommendation features.

## 13. Exception Cases

- E01: Admin chọn category nhưng chưa load được schema thuộc tính -> cho phép retry, không mất dữ liệu form đã nhập.
- E02: Admin nhập sai kiểu dữ liệu (ví dụ text cho number) -> hiển thị lỗi tại field.
- E03: Thuộc tính required bị thiếu -> chặn submit.
- E04: Thuộc tính option không thuộc bộ option hợp lệ -> backend reject.
- E05: Tạo product thành công nhưng sync event MQ fail -> không rollback transaction create; ghi log và retry theo cơ chế outbox/worker.

## 14. Acceptance Criteria

- [ ] Admin nhìn thấy section “Thông tin chi tiết sản phẩm” khi tạo sản phẩm.
- [ ] Form render động theo `ProductType` (không cùng một bộ field cho mọi loại hàng).
- [ ] Submit thành công khi dữ liệu chi tiết hợp lệ; dữ liệu được lưu vào `product_attribute_values`.
- [ ] Submit thất bại khi thiếu field required hoặc sai kiểu dữ liệu.
- [ ] Trường “Mục đích sử dụng” cho phép chọn nhiều giá trị và lưu đúng vào bảng join option.
- [ ] Trường “Độ tuổi phù hợp” hiển thị đúng nhãn trên PDP (ví dụ 16-25).
- [ ] PDP hiển thị đúng các block thông tin chi tiết sau khi tạo.
- [ ] Update product chi tiết phản ánh ngay trên PDP sau khi refresh cache.
- [ ] Event `product.attributes.updated` được publish khi có thay đổi thuộc tính chi tiết.

## 15. Risks & Recommendations

- Risk 1: Quá nhiều field làm admin nhập liệu chậm.
  - Recommendation: chia thành field bắt buộc và nâng cao; cho phép lưu nháp.
- Risk 2: Dữ liệu không đồng nhất giữa các admin.
  - Recommendation: ưu tiên option-list, hạn chế free-text với field quan trọng.
- Risk 3: Tăng độ phức tạp validation backend.
  - Recommendation: chuẩn hóa validation theo `AttributeDefinition.dataType` và viết test case theo attribute matrix.

## 16. Implementation Plan (Suggested)

1. Chuẩn hóa danh mục thuộc tính sản phẩm theo từng ProductType (BA + PO + Ops).
2. Bổ sung seed dữ liệu `AttributeDefinition` và `ProductTypeAttribute`.
3. Mở rộng DTO/API create-update product (`productAttributes`).
4. Implement repository/service lưu `ProductAttributeValue` transaction-safe.
5. Nâng cấp UI create product (dynamic form + inline validation).
6. Nâng cấp API detail + UI PDP để hiển thị.
7. Bổ sung publish event catalog và xử lý consumer (search/cache).
8. UAT theo checklist acceptance criteria.

---

### Kết luận

Giải pháp tối ưu cho bối cảnh hiện tại là tận dụng hệ attribute đã có trong schema để mở rộng thông tin chi tiết sản phẩm theo hướng cấu hình theo ProductType. Cách tiếp cận này giảm rủi ro migration, triển khai nhanh, và đủ nền tảng để mở rộng SEO/search/recommendation trong các phase tiếp theo.
