# Business Requirements Document (BRD) - Tính năng Voucher (Mã giảm giá)

## 1. Tổng quan (Executive Summary)

Tài liệu này định nghĩa các yêu cầu nghiệp vụ cho tính năng Voucher (Mã giảm giá) trên hệ thống E-commerce. Mục tiêu là đảm bảo sự thống nhất trong việc triển khai giữa các team Backend, Frontend và QA, định hướng rõ ràng logic tính toán và tránh các sai sót không đáng có về tài chính và luồng trải nghiệm khách hàng.

## 2. Phạm vi yêu cầu (Scope)

Tính năng Voucher sẽ tác động đến các thành phần sau của hệ thống:

- **Trang quản trị (Admin Panel):** Quản trị viên (Admin) tạo và quản lý voucher tại trang quản lý sản phẩm.
- **Trang chủ (Home):** Hiển thị các voucher/banner ưu đãi.
- **Chi tiết sản phẩm (Product Detail):** Hiển thị các mã giảm giá có thể áp dụng.
- **Giỏ hàng (Cart Page) & Thanh toán (Checkout):** Chức năng nhập mã, áp dụng voucher, kiểm tra tính hợp lệ và hiển thị tổng tiền sau khi giảm.

## 3. Mục tiêu kinh doanh (Business Objectives)

1. **Rõ ràng hóa:** Định nghĩa chính xác cách tạo, quản lý và áp dụng voucher. Nêu chi tiết điều kiện sử dụng cũng như logic tính giá sau giảm.
2. **Ngăn ngừa rủi ro:** Tránh sai lệch logic giữa FE và BE, đảm bảo tính toán tiền tệ chính xác tuyệt đối.
3. **Chất lượng:** Đảm bảo logic mạch lạc, dứt khoát, không mơ hồ (ambiguity) để phục vụ cho Unit Test, Integration Test của QA dễ dàng.

## 4. Các loại Voucher (Voucher Types)

Hệ thống hỗ trợ 2 loại hình Voucher chính:

### 4.1. Percentage Discount (Giảm theo % có giới hạn)

- Giảm một tỷ lệ phần trăm được cấu hình sẵn trên tổng giá trị áp dụng.
- **Bắt buộc** có cấu hình mức giới hạn số tiền giảm tối đa (Max Discount).
- _Ví dụ: Giảm 10%, tối đa 20,000 VND._

### 4.2. Fixed Amount Discount (Giảm số tiền cố định)

- Giảm trực tiếp một số tiền cố định.
- _Ví dụ: Giảm 50,000 VND._

## 5. Quy tắc nghiệp vụ (Business Rules)

### 5.1. Điều kiện áp dụng Voucher (Validate Voucher)

Một voucher chỉ được ghi nhận là hợp lệ vào thời điểm khách hàng click "Áp dụng", khi thỏa mãn **toàn bộ** các điều kiện sau:

- Voucher đang tồn tại trong cơ sở dữ liệu.
- Trạng thái của voucher đang hoạt động (`isActive = true`).
- Thời gian hiện tại nằm trong thời gian hiệu lực của voucher: `startDate <= Thời điểm hiện tại (now) <= endDate`.
- Chưa vượt quá giới hạn số lượt sử dụng tổng cộng của voucher: Số lần đã dùng < `usageLimit`.
- Chưa vượt quá giới hạn số lượt sử dụng cho mỗi cá nhân: Số lần user hiện tại đã dùng < `userUsageLimit`.
- Giá trị đơn hàng (tại thời điểm áp dụng) phải đạt mức tối thiểu cấu hình: `Tổng tiền đơn hàng >= minOrderValue`.

### 5.2. Logic tính toán và áp dụng (Apply Voucher)

Khi các mức validate trên đi qua, logic tính tiền giảm (`discount`) được định nghĩa như sau:

**Trường hợp Percentage Discount:**

```text
discount = orderTotal * (value / 100)
if (maxDiscount tồn tại) {
  discount = min(discount, maxDiscount)
}
```

**Trường hợp Fixed Amount Discount:**

```text
discount = value
```

**Tiền thanh toán cuối (Final Total):**

- `FinalTotal = orderTotal - discount`
- _(Lưu ý: Nếu `discount` > `orderTotal` thì `FinalTotal` = 0, hệ thống không cho phép số tiền thanh toán bị âm và không hoàn lại tiền thừa)._

## 6. Mô hình dữ liệu nghiệp vụ (Data Model - Business Level)

Mỗi Voucher cần phải lưu trữ và quản lý các thuộc tính nghiệp vụ cốt lõi sau:

1. `code`: Mã Voucher hiển thị/nhập liệu.
2. `type`: Loại ưu đãi (`PERCENTAGE` hoặc `FIXED`).
3. `value`: Giá trị giảm (số % hoặc số tiền).
4. `maxDiscount`: Giới hạn mức tiền giảm tối đa (bắt buộc cho `PERCENTAGE`).
5. `minOrderValue`: Giá trị đơn hàng tối thiểu cần đạt để được áp voucher.
6. `startDate`: Thời điểm bắt đầu có hiệu lực.
7. `endDate`: Thời điểm kết thúc hiệu lực.
8. `usageLimit`: Tổng số lượt sử dụng có sẵn của hệ thống.
9. `userUsageLimit`: Giới hạn số lần một khách hàng được phép dùng.
10. `isActive`: Cờ bật/tắt kích hoạt voucher từ phía Admin.

## 7. Các giai đoạn phát triển (Development Phases)

Để đảm bảo triển khai tính năng Voucher một cách an toàn và chất lượng, quá trình phát triển được chia thành 4 giai đoạn chính (Phases):

### Giai đoạn 1 (Phase 1): Database & Backend Core (Nền tảng hệ thống)

- **Database Schema:** Thiết kế bảng `Voucher` và `VoucherUsage` (lưu vết người dùng đã xài mã). Cập nhật schema Prisma và chạy migration.
- **Admin/Seller APIs:** Xây dựng API CRUD (Tạo, Đọc, Cập nhật, Vô hiệu hóa) mã giảm giá cho trang quản lý.
- **Client APIs & Core Business:**
  - API lấy danh sách các Voucher đang hiển thị (Active).
  - Viết module xử lý nghiệp vụ **Validate Voucher** và **Calculate Discount** theo như rule đã định nghĩa để gọi dùng chung trong Cart & Checkout dựa theo form kiến trước clean architure hiện có (tham khảo module auth).
  - Cập nhật hàm xử lý Tạo Đơn Hàng (Create Order API) để trừ đi `usageLimit` và thêm bản ghi vào `VoucherUsage` sau khi order thành công.
- Mỗi Voucher sẽ có 1 ảnh riêng để hiển thị trên màn hình client như là một banner

### Giai đoạn 2 (Phase 2): Cổng quản trị Admin/Seller (client-seller)

- **Thiết kế UI/UX:** Xây dựng giao diện Quản lý Voucher (Danh sách, form thêm mới/sửa).
- **Logic form:** Bắt buộc nhập liệu đúng quy định (VD: Nếu Type là `PERCENTAGE` thì bắt buộc phải nhập `maxDiscount`).
- **Tích hợp:** Nối API với Backend đã làm ở Giai đoạn 1.

### Giai đoạn 3 (Phase 3): Trải nghiệm người dùng (client-next)

- **Hiển thị (Display):** Thiết kế điểm chạm (touchpoint) trên trang Home (banner) và trang Product Detail để hiển thị các voucher khả dụng.
- **Giỏ hàng & Thanh toán (Cart & Checkout):**
  - Gắn Box nhập/chọn mã Voucher.
  - Tích hợp gọi API Validate & Calculate để tự động tính toán số tiền giảm.
  - Hiển thị rõ ràng số tiền "Tạm tính", "Giảm giá", và "Tổng tiền" (Final Total).
- **Cập nhật luồng Submit Order:** Gửi thông tin `voucherCode` kèm payload lúc thanh toán.

### Giai đoạn 4 (Phase 4): Testing & Release

- **Unit Test (BE):** Phải phủ đầy Test cases cho các cụm hàm tính toán (`Validate`, `Calculate`) với nhiều kịch bản: hết hạn, chưa tới ngày, mã bị khoá, đơn hàng chưa đạt giá trị tối thiểu, discount vượt quá orderTotal (về 0), ...
- **Integration Test:** Đội QA test E2E toàn bộ luồng tạo mã của Admin, sau đó đóng vai End-user mua hàng và thanh toán bằng mã đó.
- **UAT & Deployment:** Nghiệm thu cùng BA/PO và triển khai lên Production.
