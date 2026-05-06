# BRD: Goi y san pham dua tren hanh vi nguoi dung (AI)

## 1. Tong quan

### 1.1. Muc tieu

Xay dung chuc nang goi y san pham dua tren hanh vi nguoi dung tren website, ung dung AI de ca nhan hoa danh sach san pham, tang ty le chuyen doi va gia tri don hang.

### 1.2. Pham vi

- Ap dung cho nguoi dung da dang nhap
- Goi y tren cac vi tri chinh: trang chu, trang danh muc, trang chi tiet san pham, va tim kiem.
- Goi y theo thoi gian thuc (real-time) va theo lo trinh batch (offline).

### 1.3. Dinh nghia thanh cong

- Tang CTR (click-through rate) cua block goi y.
- Tang CVR (conversion rate) tu goi y.
- Tang AOV (average order value).
- Giam ty le thoat trang (bounce rate) tai trang chu va danh muc.

## 2. Van de kinh doanh

- Danh sach san pham hien tai chua ca nhan hoa.
- Nguoi dung mat thoi gian tim kiem, giam ty le mua hang.
- Can tang doanh thu thong qua cross-sell va up-sell.

## 3. Doi tuong va nguoi dung muc tieu

- Khach hang cua san (nguoi mua).
- Khach hang moi (cold-start).
- Khach hang quay lai (returning).

## 4. Gia tri va loi ich

- Ca nhan hoa trai nghiem mua sam.
- Tang doanh thu va hieu suat marketing.
- Giam chi phi quang cao nhom muc tieu sai.

## 5. Yeu cau nghiep vu

### 5.1. Yeu cau chuc nang

1. Goi y san pham dua tren hanh vi:
   - Xem san pham.
   - Tim kiem.
   - Them gio hang.
   - Mua hang.
   - Like/yeu thich
2. Goi y theo ngữ canh (context):
   - Trang chu: goi y pho bien va ca nhan hoa.
   - Trang danh muc: goi y theo danh muc va hanh vi gan day.
   - Trang chi tiet san pham: san pham tuong tu, bo sung.
   - Gio hang: cross-sell va up-sell.
3. Ho tro cold-start:
   - Goi y theo xu huong (trending).
   - Goi y theo vi tri dia ly.
   - Goi y theo thoi diem (ngay le, khung gio).
4. A/B testing cho cac mo hinh goi y.
5. Ghi nhan feedback:
   - Click.
   - Add-to-cart.
   - Purchase.
   - Hide/bo qua goi y (neu co).

## 6. Hanh vi du lieu dau vao

### 6.1. Su kien ghi nhan

- ViewProduct
- SearchQuery
- AddToCart
- RemoveFromCart
- Purchase
- FavoriteProduct

### 6.2. Thuoc tinh su kien

- user_id
- product_id
- category_id
- timestamp
- session_id
- device
- location

## 7. Logic goi y (muc tieu)

### 7.1. Mo hinh AI de xuat

- Collaborative Filtering (user-user, item-item).
- Content-based (du lieu thuoc tinh san pham).
- Hybrid (ket hop ca hai).
- Embedding + Similarity search.

### 7.2. Xep hang (ranking)

- Score = f(tuong tac gan day, do tuong tu, xu huong, gia, khuyen mai, ton kho).

## 8. Luong nghiep vu tong quan

1. Thu thap hanh vi tu front-end.
2. Day su kien vao he thong tracking.
3. Xu ly du lieu offline va online.
4. Mo hinh AI tao danh sach goi y.
5. Front-end hien thi danh sach.
6. Ghi nhan feedback tu nguoi dung.

## 9. Yeu cau UI/UX

- Block goi y ro rang, co tieu de.
- Hien thi toi da 6-12 san pham.
- Co label ("Goi y cho ban", "San pham tuong tu", "Co the ban thich").
- Khong lap lai san pham dang xem.

## 10. KPI va do luong

- CTR goi y.
- CVR tu goi y.
- AOV tu goi y.
- Thoi gian o lai trang.

## 11. Rui ro va giam thieu

- Cold-start: dung trending + danh muc.
- Du lieu thieu chinh xac: lam sach du lieu.
- Sai lech goi y: bo sung feedback.

## 12. Gia dinh va phu thuoc

- He thong tracking su kien da san sang.
- Du lieu san pham co day du thuoc tinh.
- Co nguon tai nguyen tinh toan cho AI.

## 13. Pham vi ngoai

- Goi y dua tren noi dung ngoai san.
- He thong khuyen mai/marketing automation phuc tap.

## 14. Lộ trình triển khai theo giai đoạn

### Giai đoạn 0: Chuẩn bị dữ liệu và phạm vi

- Xác nhận mục tiêu kinh doanh, KPI và vị trí hiển thị.
- Chốt danh sách sự kiện và thuộc tính bắt buộc.
- Kiểm kê nguồn dữ liệu sản phẩm (thuộc tính, tồn kho, giá, khuyến mãi).
- Đầu ra: tài liệu tracking spec, mapping dữ liệu sản phẩm.
- Tiêu chí hoàn thành: đủ sự kiện tối thiểu và dữ liệu sản phẩm đầy đủ thuộc tính chính.

### Giai đoạn 1: Tracking và chất lượng dữ liệu

- Triển khai tracking sự kiện ở front-end và back-end.
- Thiết lập pipeline lưu trữ và làm sạch dữ liệu.
- Dashboard giám sát dữ liệu (tỉ lệ thiếu, độ trễ, số lượng sự kiện).
- Đầu ra: dữ liệu hành vi ổn định, báo cáo chất lượng dữ liệu.
- Tiêu chí hoàn thành: độ trễ < 15 phút cho batch, tỉ lệ thiếu < 2%.

### Giai đoạn 2: Gợi ý nền tảng (baseline)

- Mô hình trending và item-item đơn giản.
- Hiển thị ở trang chủ và trang chi tiết sản phẩm.
- Ghi nhận feedback cơ bản (click, add-to-cart).
- Đầu ra: API gợi ý baseline, UI block hiển thị.
- Tiêu chí hoàn thành: CTR tăng so với danh sách tĩnh.

### Giai đoạn 3: Hybrid + ranking theo ngữ cảnh

- Kết hợp collaborative + content-based.
- Xếp hạng theo ngữ cảnh (danh mục, giá, tồn kho, khuyến mãi).
- Mở rộng vị trí hiển thị (danh mục, giỏ hàng).
- Đầu ra: mô hình hybrid, logic ranking có thể cấu hình.
- Tiêu chí hoàn thành: CVR từ gợi ý tăng, AOV tăng.

### Giai đoạn 4: Cá nhân hóa real-time + A/B testing

- Cá nhân hóa theo phiên và hành vi gần đây.
- Hạ tầng A/B testing cho mô hình và vị trí hiển thị.
- Tối ưu độ trễ API và cache.
- Đầu ra: realtime personalization, hệ thống A/B testing.
- Tiêu chí hoàn thành: P95 < 300ms, hiệu quả A/B rõ ràng.

### Giai đoạn 5: Tối ưu vận hành và mở rộng

- Tự động huấn luyện định kỳ và giám sát drift.
- Mở rộng sang phân khúc người dùng mới, địa lý mới.
- Chuẩn hóa báo cáo KPI và quy trình rollback.
- Đầu ra: quy trình vận hành ổn định, playbook sự cố.
- Tiêu chí hoàn thành: hệ thống ổn định, KPI duy trì bền vững.

## 15. Các bước triển khai chi tiết (không bao gồm thời gian)

### Bước 1: Chốt mục tiêu và phạm vi

- Xác định KPI chính cho gợi ý (CTR, CVR, AOV).
- Chốt vị trí hiển thị và số lượng sản phẩm hiển thị mỗi vị trí.
- Xác nhận đối tượng áp dụng (đăng nhập, ẩn danh).

### Bước 2: Thiết kế tracking và dữ liệu

- Định nghĩa sự kiện, schema và thuộc tính bắt buộc.
- Tạo tài liệu tracking spec và kiểm thử dữ liệu đầu vào.
- Xác nhận nguồn dữ liệu sản phẩm, chuẩn hóa thuộc tính.

### Bước 3: Xây dựng pipeline dữ liệu

- Thiết lập luồng ingest sự kiện và lưu trữ.
- Thiết lập làm sạch, chuẩn hóa và tổng hợp dữ liệu.
- Tạo dashboard giám sát chất lượng dữ liệu.

### Bước 4: Thiết kế mô hình gợi ý ban đầu

- Chọn baseline: trending + item-item.
- Xây dựng logic loại trừ (ví dụ: không gợi ý sản phẩm đã xem).
- Định nghĩa chiến lược fallback cho cold-start.

### Bước 5: Xây dựng API gợi ý

- Thiết kế API contract (request, response, timeout).
- Xây dựng service gợi ý và cache.
- Thêm log phục vụ phân tích hiệu quả.

### Bước 6: Tích hợp front-end

- Thiết kế UI block gợi ý theo vị trí.
- Tích hợp API và xử lý trạng thái lỗi.
- Ghi nhận feedback (click, add-to-cart).

### Bước 7: Nâng cấp mô hình và ranking

- Bổ sung content-based và hybrid.
- Thêm ranking theo ngữ cảnh (danh mục, giá, khuyến mãi, tồn kho).
- Tối ưu chất lượng gợi ý theo KPI.

### Bước 8: Thiết lập A/B testing

- Thiết kế phân nhóm người dùng.
- Thiết lập đo lường và báo cáo kết quả.
- Quy trình rollout/rollback theo kết quả test.

### Bước 9: Vận hành và cải tiến liên tục

- Thiết lập lịch huấn luyện lại định kỳ.
- Giám sát drift và chất lượng mô hình.
- Cải tiến trải nghiệm dựa trên feedback thực tế.
