# Đề xuất chỉnh sửa cách tổ chức Product theo ý tưởng mới

Tài liệu này mô tả thiết kế mục tiêu để hỗ trợ đầy đủ 2 kịch bản:

- Product không có biến thể
- Product có nhiều biến thể

Mục tiêu là đồng nhất cách lưu dữ liệu, API, UI admin và UI client, tránh trạng thái nhập một đằng hiển thị một nẻo.

## 1. Nguyên tắc chung

1. Product là thực thể gốc, luôn tồn tại độc lập.
2. Variant là thực thể mở rộng, có thể có hoặc không.
3. Giá và tồn kho hiển thị cho người dùng được tính theo quy tắc ưu tiên rõ ràng.
4. Trang detail client và trang edit admin phải render đúng theo đúng mode của product.

## 2. Đề xuất dữ liệu lõi

## 2.1. Product

Bổ sung trường mode để phân loại loại sản phẩm:

- productMode: SIMPLE hoặc VARIANT

Ý nghĩa:

- SIMPLE: không dùng biến thể
- VARIANT: dùng một hoặc nhiều biến thể

Gợi ý field cấp product:

- id, name, basePrice
- simpleStockAvailable (nullable, dùng khi SIMPLE)
- productMode
- status, isDeleted
- categories, tags
- productAttributes

## 2.2. Variant

Giữ cấu trúc hiện tại cho trường hợp VARIANT:

- id, productId, sku, optionKey
- attributes
- price
- stockAvailable
- minStock

## 2.3. Rule toàn vẹn dữ liệu

1. SIMPLE:

- Không được có variant active
- Giá bán lấy từ product.basePrice
- Tồn kho lấy từ product.simpleStockAvailable

2. VARIANT:

- Bắt buộc có ít nhất 1 variant active
- Giá hiển thị lấy từ min giá variant
- Tồn kho hiển thị là tổng tồn kho variant

## 3. Luồng tạo Product ở Admin

## 3.1. Kịch bản A: Tạo product không biến thể (SIMPLE)

UI create admin cần có lựa chọn mode:

- Loại sản phẩm: Không biến thể hoặc Có biến thể

Khi chọn Không biến thể:

1. Ẩn toàn bộ block nhập variant.
2. Hiển thị trường tồn kho đơn:

- simpleStockAvailable

3. Bắt buộc nhập:

- name, basePrice, category
- simpleStockAvailable >= 0

4. Payload create gửi lên:

- productMode = SIMPLE
- variants = []
- simpleStockAvailable có giá trị

Xử lý backend:

1. Cho phép create với variants rỗng nếu mode là SIMPLE.
2. Không tạo dòng nào trong bảng product_variants.
3. Lưu simpleStockAvailable ở bảng products hoặc bảng stock summary riêng.

## 3.2. Kịch bản B: Tạo product nhiều biến thể (VARIANT)

Khi chọn Có biến thể:

1. Hiển thị đầy đủ block variants.
2. Ẩn hoặc disable simpleStockAvailable.
3. Bắt buộc có tối thiểu 1 variant hợp lệ.
4. Validate trùng optionKey như hiện tại.

Xử lý backend:

1. Bắt buộc variants length > 0 với mode VARIANT.
2. Tạo variants như flow hiện tại.
3. Đồng bộ axis attributes và option như hiện tại.

## 4. Hiển thị trang detail product của Client

## 4.1. Detail cho SIMPLE

UI detail cần xử lý như sau:

1. Không render bộ chọn màu, size.
2. Render một khối mua hàng đơn giản:

- Giá: product.basePrice
- Tồn kho: simpleStockAvailable
- Nút thêm giỏ hàng gắn trực tiếp productId, không cần variantId

3. Ảnh dùng ảnh cấp product.
4. Nếu simpleStockAvailable = 0 thì hiển thị hết hàng.

## 4.2. Detail cho VARIANT

Giữ logic hiện tại, với một số rule rõ ràng:

1. Render bộ chọn thuộc tính (size, color, axis khác nếu có).
2. Giá và tồn kho phụ thuộc variant đang chọn.
3. Nếu chưa chọn đủ thuộc tính thì khóa nút mua.
4. Dữ liệu ảnh ưu tiên theo variant, fallback về ảnh product.

## 5. Hiển thị trang edit product của Admin

## 5.1. Edit cho SIMPLE

1. Hiển thị mode là SIMPLE.
2. Không hiển thị bảng biến thể.
3. Cho phép sửa:

- name, basePrice, simpleStockAvailable, category/tag, attributes

4. Không cho tạo variant ngầm nếu user không bật chuyển mode.

## 5.2. Edit cho VARIANT

1. Hiển thị đầy đủ danh sách biến thể.
2. Cho phép thêm, sửa, xóa biến thể.
3. Tồn kho tổng chỉ là số tổng hợp, không nhập trực tiếp ở cấp product.

## 5.3. Chuyển mode trong trang edit

Cho phép chuyển mode có kiểm soát:

1. VARIANT -> SIMPLE:

- Cảnh báo mất dữ liệu variant
- Chọn chính sách chuyển đổi:
  - Giữ giá thấp nhất variant làm basePrice
  - Tổng stock variant làm simpleStockAvailable
- Soft delete hoặc archive variants

2. SIMPLE -> VARIANT:

- Tạo wizard tạo biến thể đầu tiên
- Sau khi có ít nhất 1 variant hợp lệ mới cho lưu mode VARIANT

## 5.4. Trường hợp product chỉ có 1 variant và ngừng kinh doanh variant đó

Đây là case quan trọng vì nếu xóa variant cuối cùng thì product sẽ rơi vào trạng thái không còn biến thể bán được.

Quy tắc xử lý đề xuất:

1. Không hard delete variant để tránh mất lịch sử đơn hàng, tồn kho, báo cáo.
2. Chuyển variant cuối sang trạng thái ngừng kinh doanh (isDeleted hoặc status = INACTIVE).
3. Hệ thống bắt buộc chọn 1 trong 2 hướng cho product:

- Hướng A: Chuyển product sang SIMPLE và set simpleStockAvailable = 0.
- Hướng B: Giữ product ở VARIANT nhưng tự động chuyển product status = INACTIVE để ẩn khỏi luồng bán.

Khuyến nghị nghiệp vụ:

- Ưu tiên Hướng A nếu business muốn giữ landing/detail page sản phẩm để SEO hoặc thông tin tham khảo.
- Ưu tiên Hướng B nếu business xem sản phẩm hết vòng đời và không muốn bán tạm thời.

Rule hiển thị ở client detail:

1. Nếu đã chuyển sang SIMPLE với stock = 0: hiển thị "Hết hàng", disable nút mua.
2. Nếu giữ VARIANT nhưng không còn variant active: không render selector variant và hiển thị thông báo "Sản phẩm tạm ngừng kinh doanh".

Rule hiển thị ở admin edit:

1. Hiển thị banner cảnh báo: "Sản phẩm không còn biến thể bán được".
2. Cho admin thao tác nhanh:

- Chuyển sang SIMPLE.
- Thêm variant mới.
- Đặt product INACTIVE.

## 5.5. Decision Matrix: Khi nào chọn SIMPLE, khi nào chọn INACTIVE

Mục này dùng để chốt quyết định nhanh khi product không còn variant bán được.

### 5.5.1. Chọn SIMPLE (simpleStockAvailable = 0) khi

1. Vẫn muốn giữ trang detail để SEO, traffic hoặc tham khảo thông tin sản phẩm.
2. Có kế hoạch nhập lại hàng ở dạng không biến thể hoặc chưa chắc chắn về biến thể mới.
3. Vẫn muốn giữ product trong catalog nội bộ để marketing, recommendation hoặc lịch sử duyệt.

Kết quả mong đợi:

- Product vẫn truy cập được ở detail page.
- Nút mua bị khóa vì hết hàng.
- Không còn selector biến thể.

### 5.5.2. Chọn INACTIVE khi

1. Product đã hết vòng đời kinh doanh và không muốn bán/không muốn hiển thị cho khách.
2. Không muốn product xuất hiện trong listing, search hoặc chiến dịch active.
3. Không còn kế hoạch mở bán lại trong ngắn/trung hạn.

Kết quả mong đợi:

- Product bị loại khỏi luồng bán và listing mặc định.
- Detail page có thể ẩn hoặc trả trạng thái tạm ngừng tùy policy SEO của hệ thống.

### 5.5.3. Bảng quyết định nhanh

| Tình huống                                          | Quyết định khuyến nghị              |
| --------------------------------------------------- | ----------------------------------- |
| Muốn giữ trang để SEO, chỉ tạm hết hàng             | SIMPLE + `simpleStockAvailable = 0` |
| Muốn dừng bán hoàn toàn, không muốn hiển thị        | `status = INACTIVE`                 |
| Chưa chắc kế hoạch, cần giữ dữ liệu để mở lại nhanh | SIMPLE + `simpleStockAvailable = 0` |
| Sản phẩm lỗi thời, ngừng vĩnh viễn                  | `status = INACTIVE`                 |

### 5.5.4. Rule vận hành bắt buộc

1. Không hard delete variant cuối nếu đã phát sinh đơn hàng.
2. Luôn lưu log chuyển trạng thái (ai thao tác, thời điểm, lý do).
3. Khi chuyển sang SIMPLE, hệ thống tự kiểm tra và đảm bảo không còn variant active.
4. Khi chuyển INACTIVE, cần đồng bộ loại product khỏi campaign/search cache.

## 6. Đề xuất API contract

## 6.1. Create product

Input đề xuất:

- name
- basePrice
- productMode
- simpleStockAvailable (optional, required khi SIMPLE)
- variants (optional, required khi VARIANT)
- images, categoryIds, tagIds, productAttributes

Validation đề xuất:

- productMode SIMPLE: variants phải rỗng
- productMode VARIANT: variants phải có ít nhất 1 item

## 6.2. Update product

Update cho phép:

- Sửa thông tin trong cùng mode
- Chuyển mode qua trường productMode và conversionOptions

## 6.3. Get product detail

Response nên trả rõ:

- productMode
- pricing
  - basePrice
  - minVariantPrice
  - maxVariantPrice
- inventory
  - simpleStockAvailable
  - totalVariantStock

Client chỉ cần đọc productMode để quyết định render.

## 7. Quy tắc tính giá và tồn kho để hiển thị

1. SIMPLE:

- currentPrice = basePrice
- availableStock = simpleStockAvailable

2. VARIANT:

- listPrice = khoảng giá từ variants
- selectedPrice = giá variant được chọn
- availableStock = tồn kho variant được chọn

## 8. Kế hoạch triển khai an toàn

## 8.1. Giai đoạn 1: Backward compatible

1. Thêm productMode và simpleStockAvailable vào schema.
2. Migrate dữ liệu cũ:

- Nếu product có variant active thì gán VARIANT
- Nếu không có variant active thì gán SIMPLE

3. API trả thêm field mới nhưng chưa phá field cũ.

## 8.2. Giai đoạn 2: Cập nhật UI admin và client

1. Admin create/edit hỗ trợ chọn mode.
2. Client detail render theo mode.
3. Theo dõi log lỗi add to cart và checkout.

## 8.3. Giai đoạn 3: Siết validation cứng

1. Chặn hoàn toàn create SIMPLE mà có variants.
2. Chặn create VARIANT mà không có variants.
3. Thêm test cho 2 mode ở backend và frontend.

## 8.4. Ghi chú triển khai thực tế hiện tại (phase tạm thời)

Để không phải refactor sâu module Cart/Checkout ngay lập tức, hệ thống có thể triển khai mode SIMPLE theo cách trung gian:

1. Ở UI admin, user chọn "Không biến thể" và nhập `simpleStockAvailable`.
2. Khi submit, backend hoặc client sẽ tự sinh 1 default variant nội bộ:

- `attributes = {}`
- `sku = <PRODUCT_NAME>-DEFAULT`
- `price = basePrice`
- `stockAvailable = simpleStockAvailable`

3. Với cách này, Cart/Checkout vẫn chạy theo cơ chế `variantId` hiện có.

Ưu điểm:

- Triển khai nhanh, giảm rủi ro đứt luồng mua hàng.
- Không phải chỉnh lớn module cart trong cùng phase.

Hạn chế:

- Về mặt dữ liệu, product SIMPLE vẫn có 1 variant kỹ thuật.
- Cần ẩn default variant khỏi UI admin/client để tránh gây hiểu nhầm nghiệp vụ.

## 9. Checklist nghiệm thu

1. Tạo product SIMPLE không có variant thành công.
2. Detail client của SIMPLE không hiển thị chọn size màu.
3. Add to cart SIMPLE thành công.
4. Tạo product VARIANT nhiều biến thể thành công.
5. Detail client của VARIANT hiển thị đúng giá theo variant chọn.
6. Admin edit hiển thị đúng mode, không sinh variant ngầm.
7. Chuyển mode có cảnh báo và chuyển đổi dữ liệu đúng.
8. Xóa/ngừng kinh doanh variant cuối không làm product rơi vào trạng thái lỗi, UI client và admin đều hiển thị đúng.

## 10. Tác động lên các khu vực hiện tại

1. Admin create product:

- Cần bỏ giả định luôn có 1 variant mặc định.

2. Admin API create product:

- Cần bỏ validate cứng luôn bắt buộc variants > 0, thay bằng validate theo mode.

3. Public product detail:

- Cần render phân nhánh theo productMode.

4. Cart và checkout:

- Cần hỗ trợ item không variantId khi productMode là SIMPLE.

Tài liệu này là blueprint nghiệp vụ và kỹ thuật để team triển khai đồng bộ.
