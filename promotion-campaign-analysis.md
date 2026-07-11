# Phân tích chức năng Promotion theo hướng chiến dịch hiển thị

## 1. Cách hiểu mới về Promotion

Trong hệ thống hiện tại, promotion không nên chỉ được hiểu là một luật giảm giá tự động. Promotion nên là một **chương trình khuyến mãi có thời gian, nội dung truyền thông, hình ảnh banner và điều kiện áp dụng rõ ràng**.

Ví dụ:

- Giờ vàng giảm giá từ 20:00 đến 22:00.
- Chương trình giảm giá ngày lễ.
- Tri ân khách hàng thân thiết.
- Flash sale cuối tuần.
- Khuyến mãi khai trương, sinh nhật shop hoặc sự kiện đặc biệt.

Như vậy, promotion có 2 vai trò chính:

- **Vai trò marketing**: người dùng nhìn thấy chương trình khi vào website.
- **Vai trò nghiệp vụ**: hệ thống tự áp dụng giảm giá cho sản phẩm hoặc nhóm sản phẩm trong thời gian hợp lệ.

## 2. Phân biệt Promotion và Voucher

Voucher là mã ưu đãi khách hàng nhập hoặc chọn khi thanh toán.

Promotion là chương trình giảm giá tự động, có thể hiển thị như một chiến dịch trên trang web.

| Tiêu chí | Voucher | Promotion |
| --- | --- | --- |
| Cách dùng | Người dùng nhập/chọn mã | Hệ thống tự áp dụng |
| Hiển thị | Ví voucher, checkout | Trang chủ, banner, trang sản phẩm |
| Mục tiêu | Cá nhân hóa hoặc kích thích chốt đơn | Truyền thông chiến dịch, đẩy doanh số |
| Ví dụ | WELCOME10, BIRTHDAY50 | Giờ vàng, sale lễ, tri ân khách hàng |
| Có ảnh/banner | Có thể có | Nên bắt buộc có |

## 3. Các loại Promotion nên hỗ trợ

### 3.1. Giờ vàng

Giờ vàng là chương trình chỉ có hiệu lực trong một khung giờ cụ thể.

Ví dụ:

- Tên: Giờ vàng săn sale.
- Thời gian: 20:00 - 22:00 ngày 20/07/2026.
- Ưu đãi: Giảm 20% cho một số sản phẩm.
- Hiển thị: Banner ở trang chủ và nhãn đếm ngược trên sản phẩm.

Đặc điểm:

- Cần có thời gian bắt đầu và kết thúc chính xác.
- Nên có countdown để tạo cảm giác khẩn cấp.
- Có thể áp dụng cho tất cả sản phẩm, danh mục hoặc sản phẩm được chọn.

### 3.2. Chương trình ngày lễ

Đây là các chương trình theo dịp đặc biệt.

Ví dụ:

- Sale 8/3.
- Sale 20/10.
- Sale Quốc khánh.
- Sale cuối năm.
- Black Friday.

Đặc điểm:

- Thời gian thường kéo dài nhiều ngày.
- Banner nên nổi bật ở trang chủ.
- Có thể có landing section riêng để gom sản phẩm thuộc chương trình.

### 3.3. Tri ân khách hàng

Promotion tri ân có thể áp dụng cho nhóm khách hàng nhất định.

Ví dụ:

- Tri ân khách hàng hạng Bạc.
- Tri ân khách hàng hạng Vàng.
- Giảm giá cho khách đã từng mua hàng.

Đặc điểm:

- Cần liên kết với hạng thành viên hoặc điều kiện người dùng.
- Người dùng đủ điều kiện nên nhìn thấy thông điệp rõ ràng.
- Người dùng không đủ điều kiện có thể thấy banner nhưng không được áp dụng giảm giá, hoặc không thấy tùy chiến lược.

## 4. Promotion nên có ảnh/banner

Vì promotion là chiến dịch mà người dùng cần nhìn thấy khi vào website, mỗi promotion nên có ảnh truyền thông riêng.

Các trường nên có:

- `bannerImageUrl`: ảnh banner chính.
- `title`: tiêu đề chương trình.
- `subtitle` hoặc `description`: mô tả ngắn.
- `startAt`: thời gian bắt đầu.
- `endAt`: thời gian kết thúc.
- `displayPriority`: độ ưu tiên hiển thị.
- `isFeatured`: có đưa lên trang chủ hay không.
- `ctaLabel`: chữ nút kêu gọi hành động, ví dụ "Mua ngay", "Xem ưu đãi".
- `ctaUrl`: đường dẫn khi bấm banner.

Ảnh promotion nên dùng ở:

- Trang chủ.
- Trang danh mục.
- Trang chi tiết sản phẩm nếu sản phẩm thuộc promotion.
- Trang danh sách promotion hoặc sự kiện.

## 5. Gợi ý mô hình dữ liệu

Model promotion hiện tại nên được mở rộng theo hướng campaign.

Các nhóm dữ liệu chính:

### 5.1. Thông tin chiến dịch

```text
id
name
slug
title
subtitle
description
bannerImageUrl
mobileBannerImageUrl
status
startAt
endAt
displayPriority
isFeatured
ctaLabel
ctaUrl
createdAt
updatedAt
```

### 5.2. Luật giảm giá

```text
type: PERCENTAGE | FIXED_AMOUNT | SALE_PRICE
value
maxDiscount
scopeType: ALL_PRODUCTS | INCLUDE_PRODUCTS | INCLUDE_CATEGORIES | MEMBER_TIERS
includedProductIds
includedCategoryIds
memberTiers
includeDescendants
stackableWithVoucher
usageLimit
```

### 5.3. Kiểu chương trình

Nên thêm trường:

```text
campaignType: FLASH_SALE | HOLIDAY | CUSTOMER_APPRECIATION | SEASONAL | CUSTOM
```

Ý nghĩa:

- `FLASH_SALE`: giờ vàng, flash sale.
- `HOLIDAY`: chương trình ngày lễ.
- `CUSTOMER_APPRECIATION`: tri ân khách hàng.
- `SEASONAL`: sale theo mùa.
- `CUSTOM`: chương trình tùy chỉnh.

## 6. Trạng thái Promotion

Nên có các trạng thái:

```text
DRAFT
SCHEDULED
ACTIVE
PAUSED
ENDED
```

Ý nghĩa:

- `DRAFT`: đang soạn, chưa hiển thị.
- `SCHEDULED`: đã lên lịch, chưa đến thời gian chạy.
- `ACTIVE`: đang chạy.
- `PAUSED`: tạm dừng thủ công.
- `ENDED`: đã kết thúc.

Hệ thống có thể tính trạng thái hiển thị dựa trên `status`, `startAt`, `endAt`.

## 7. Cách hiển thị trên website người dùng

### 7.1. Trang chủ

Trang chủ nên có khu vực promotion nổi bật:

- Banner lớn cho promotion ưu tiên cao nhất.
- Carousel hoặc grid nhỏ cho các promotion đang chạy.
- Countdown nếu là giờ vàng.
- Nút điều hướng đến danh sách sản phẩm thuộc promotion.

Ví dụ:

```text
[Banner]
Giờ vàng săn sale
Giảm đến 30% từ 20:00 đến 22:00
[Mua ngay]
```

### 7.2. Trang danh sách sản phẩm

Sản phẩm thuộc promotion nên có:

- Nhãn "Đang sale".
- Giá gốc gạch ngang.
- Giá sau promotion.
- Tên chương trình nếu cần.

### 7.3. Trang chi tiết sản phẩm

Nếu sản phẩm thuộc promotion:

- Hiển thị tên chương trình.
- Hiển thị thời gian còn lại.
- Hiển thị mức giảm.
- Giải thích ngắn: "Ưu đãi tự động áp dụng khi thanh toán".

### 7.4. Checkout

Ở checkout, promotion nên xuất hiện trong phần tổng tiền:

```text
Tạm tính: 500.000 đ
Giảm từ chương trình Giờ vàng: -80.000 đ
Voucher: -20.000 đ
Tổng thanh toán: 400.000 đ
```

Nếu promotion không cho cộng voucher, checkout cần thông báo rõ.

## 8. Admin cần quản lý những gì

Trang admin promotion nên có:

- Tên chương trình.
- Loại chương trình.
- Ảnh banner.
- Thời gian bắt đầu/kết thúc.
- Phạm vi áp dụng.
- Loại giảm giá.
- Giá trị giảm.
- Có hiển thị trên trang chủ không.
- Độ ưu tiên hiển thị.
- Trạng thái.

Khi chọn sản phẩm áp dụng, admin nên chọn bằng modal có ảnh sản phẩm, tên, giá, danh mục và tồn kho để tránh nhầm.

## 9. Quy tắc nghiệp vụ quan trọng

### 9.1. Promotion tự áp dụng

Người dùng không cần nhập mã. Nếu sản phẩm hoặc giỏ hàng thỏa điều kiện, hệ thống tự tính giảm giá.

### 9.2. Không áp dụng ngoài thời gian

Nếu chưa đến `startAt` hoặc đã qua `endAt`, promotion không được áp dụng.

### 9.3. Ưu tiên khi nhiều promotion cùng áp dụng

Cần có quy tắc rõ:

- Chọn promotion có mức giảm tốt nhất.
- Hoặc dùng `priority` để chọn promotion ưu tiên cao hơn.
- Hoặc cho phép cộng nhiều promotion nếu `stackable` bật.

Khuyến nghị giai đoạn đầu:

- Một sản phẩm chỉ nhận một promotion tốt nhất.
- Promotion có `priority` cao hơn được xét trước.
- Voucher xử lý sau promotion.

### 9.4. Không gây nhầm với voucher

Promotion nên có dòng giải thích:

```text
Ưu đãi được áp dụng tự động, không cần nhập mã.
```

## 10. API gợi ý cho frontend

### 10.1. Lấy promotion đang hiển thị

```http
GET /api/promotions/active
```

Trả về:

```json
{
  "items": [
    {
      "id": "promotion-id",
      "name": "Giờ vàng săn sale",
      "campaignType": "FLASH_SALE",
      "bannerImageUrl": "https://...",
      "mobileBannerImageUrl": "https://...",
      "startAt": "2026-07-20T13:00:00.000Z",
      "endAt": "2026-07-20T15:00:00.000Z",
      "ctaLabel": "Mua ngay",
      "ctaUrl": "/promotions/gio-vang-san-sale"
    }
  ]
}
```

### 10.2. Lấy chi tiết promotion

```http
GET /api/promotions/:slug
```

Dùng để hiển thị landing section của chương trình.

### 10.3. Lấy sản phẩm thuộc promotion

```http
GET /api/promotions/:slug/products
```

Dùng cho trang người dùng xem tất cả sản phẩm trong chương trình.

## 11. Đề xuất thay đổi UI hiện tại

Trang admin `Promotion tự động` hiện nên đổi cách diễn đạt thành:

```text
Chương trình khuyến mãi
```

Hoặc:

```text
Chiến dịch khuyến mãi
```

Vì tên này đúng hơn với mục tiêu giờ vàng, ngày lễ, tri ân khách hàng.

Các trường nên thêm vào form:

- Loại chương trình.
- Ảnh banner.
- Ảnh banner mobile.
- Tiêu đề hiển thị.
- Mô tả ngắn.
- Nút kêu gọi hành động.
- Đường dẫn khi bấm banner.
- Hiển thị trên trang chủ.
- Thứ tự ưu tiên.

## 12. Lộ trình triển khai

### Giai đoạn 1

- Đổi tên UI từ "Promotion tự động" thành "Chiến dịch khuyến mãi".
- Thêm ảnh banner cho promotion.
- Thêm loại chương trình: giờ vàng, ngày lễ, tri ân, tùy chỉnh.
- Hiển thị promotion nổi bật ở trang chủ.

### Giai đoạn 2

- Thêm trang chi tiết promotion.
- Hiển thị danh sách sản phẩm thuộc promotion.
- Thêm countdown cho giờ vàng.
- Hiển thị nhãn promotion trên card sản phẩm.

### Giai đoạn 3

- Tối ưu rule áp dụng nhiều promotion.
- Báo cáo hiệu quả từng promotion.
- Tính doanh thu, số đơn, số lượt xem, số lượt bấm banner.

## 13. Kết luận

Promotion trong hướng mới nên được thiết kế như một **chiến dịch khuyến mãi có nội dung hiển thị**, không chỉ là một rule giảm giá trong backend.

Vì người dùng cần nhìn thấy chương trình khi vào website, promotion nên có banner, tiêu đề, mô tả, thời gian chạy và trang/shelf sản phẩm liên quan. Điều này phù hợp hơn với các use case như giờ vàng, ngày lễ và tri ân khách hàng.
