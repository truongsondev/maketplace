# Đặc tả Use Case - Xem danh sách sản phẩm public

## 1. Tóm tắt

| Trường                    | Nội dung                                                                                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Use Case ID               | UC-PROD-PUBLIC-LIST                                                                                                                                   |
| Use Case Name             | Xem danh sách sản phẩm public                                                                                                                         |
| Use Case Description      | Là Khách vãng lai hoặc Khách hàng, tôi muốn xem danh sách sản phẩm đang bán để tìm sản phẩm phù hợp và quyết định có mua hay không.                   |
| Primary Actor             | Khách vãng lai, Khách hàng                                                                                                                            |
| Supporting Actors         | Hệ thống website bán hàng                                                                                                                             |
| Trigger                   | Người dùng mở trang danh sách sản phẩm từ trang chủ, menu, banner, hoặc đường dẫn chia sẻ.                                                            |
| Pre-Conditions            | (1) Website hoạt động bình thường. (2) Có dữ liệu sản phẩm đang ở trạng thái được phép hiển thị công khai.                                            |
| Post-Conditions (Success) | (1) Danh sách sản phẩm được hiển thị đầy đủ theo điều kiện tìm kiếm/lọc. (2) Người dùng có thể tiếp tục xem chi tiết sản phẩm hoặc thêm vào giỏ hàng. |
| Post-Conditions (Failure) | Danh sách không tải được hoặc không có kết quả phù hợp; hệ thống hiện thông báo rõ ràng để người dùng thử lại hoặc điều chỉnh bộ lọc.                 |

## 2. Luồng

### 2.1 Luồng chính (Xem danh sách mặc định)

1. Người dùng truy cập website.
2. Người dùng vào khu vực Sản phẩm hoặc danh mục trên trang chủ.
3. Hệ thống tải danh sách sản phẩm public theo thứ tự mặc định.
4. Hệ thống hiển thị từng sản phẩm với thông tin cơ bản (tên, giá, hình ảnh, trạng thái còn hàng nếu có).
5. Người dùng cuộn trang để xem thêm các sản phẩm.
6. Hệ thống tải thêm dữ liệu và tiếp tục hiển thị danh sách.
7. Người dùng chọn một sản phẩm để xem chi tiết.
8. Hệ thống mở trang chi tiết sản phẩm đã chọn.

### 2.2 Luồng thay thế

#### A1 - Tìm kiếm sản phẩm theo từ khóa

1. Người dùng nhập từ khóa vào ô tìm kiếm.
2. Hệ thống tìm các sản phẩm public phù hợp.
3. Hệ thống cập nhật danh sách theo kết quả tìm kiếm.
4. Người dùng tiếp tục xem danh sách hoặc chọn sản phẩm cần xem chi tiết.

#### A2 - Lọc và sắp xếp danh sách

1. Người dùng chọn bộ lọc (ví dụ: danh mục, khoảng giá, thương hiệu).
2. Người dùng chọn sắp xếp (ví dụ: mới nhất, giá tăng dần, giá giảm dần).
3. Hệ thống cập nhật danh sách theo bộ lọc và sắp xếp vừa chọn.
4. Hệ thống hiển thị thông tin để người dùng biết đang áp dụng bộ lọc nào.

#### A3 - Không có kết quả phù hợp

1. Người dùng tìm kiếm hoặc lọc với điều kiện hẹp.
2. Hệ thống không tìm thấy sản phẩm phù hợp.
3. Hệ thống hiện thông báo không có kết quả và gợi ý bộ lọc phổ biến hoặc nút xóa bộ lọc.
4. Người dùng điều chỉnh tiêu chí và tiếp tục xem danh sách.

### 2.3 Luồng ngoại lệ

#### E1 - Lỗi tải dữ liệu tạm thời

- Điều kiện: Hệ thống gặp lỗi kết nối hoặc dịch vụ dữ liệu tạm thời không sẵn sàng.
- Hệ thống: Hiện thông báo hệ thống đang bận và cung cấp nút thử lại.
- Kết quả: Người dùng thử lại để tải danh sách.

#### E2 - Dữ liệu sản phẩm không hợp lệ

- Điều kiện: Một số sản phẩm thiếu thông tin bắt buộc (ví dụ: không có tên hoặc giá).
- Hệ thống: Không hiển thị sản phẩm lỗi trên danh sách và ghi nhận để bộ phận vận hành xử lý.
- Kết quả: Danh sách vẫn hiển thị các sản phẩm hợp lệ để không gián đoạn trải nghiệm.

#### E3 - Thao tác lọc/tìm kiếm quá nhanh liên tiếp

- Điều kiện: Người dùng thay đổi bộ lọc hoặc từ khóa liên tục trong thời gian ngắn.
- Hệ thống: Ưu tiên kết quả mới nhất, bỏ qua các kết quả cũ để tránh nháy dữ liệu.
- Kết quả: Danh sách cuối cùng phản ánh đúng lựa chọn gần nhất của người dùng.

## 3. Thông tin bổ sung

### 3.1 Quy tắc nghiệp vụ

- BR-01: Chỉ hiển thị sản phẩm ở trạng thái được phép bán công khai.
- BR-02: Sản phẩm hiển thị trên danh sách phải có tối thiểu tên, giá và hình ảnh đại diện.
- BR-03: Khi người dùng áp dụng bộ lọc/tìm kiếm, kết quả phải được cập nhật theo đúng điều kiện đã chọn.
- BR-04: Nếu không có kết quả, hệ thống phải hiện thông báo dễ hiểu và cho phép người dùng quay về danh sách rộng hơn.
- BR-05: Danh sách public không yêu cầu đăng nhập.

### 3.2 Yêu cầu phi chức năng

- NFR-01: Thời gian hiển thị danh sách lần đầu không vượt quá 3 giây trong điều kiện mạng bình thường.
- NFR-02: Các thao tác tìm kiếm/lọc/sắp xếp phản hồi kết quả trong mục tiêu dưới 2 giây với dữ liệu thông thường.
- NFR-03: Giao diện danh sách sản phẩm hoạt động tốt trên mobile, tablet, desktop.
- NFR-04: Khi lỗi xảy ra, thông báo phải ngắn gọn, dễ hiểu, không hiển thị thông tin kỹ thuật nội bộ.

### 3.3 Tiêu chí nghiệm thu

- AC-01: Người dùng chưa đăng nhập vẫn xem được danh sách sản phẩm public.
- AC-02: Mỗi sản phẩm trong danh sách hiển thị đủ tên, giá, hình ảnh đại diện.
- AC-03: Khi nhập từ khóa tìm kiếm hợp lệ, danh sách cập nhật theo từ khóa vừa nhập.
- AC-04: Khi áp dụng bộ lọc và sắp xếp, danh sách thay đổi đúng theo lựa chọn của người dùng.
- AC-05: Khi không có kết quả, hệ thống hiện thông báo rõ ràng và có cách để người dùng quay lại danh sách rộng hơn.
- AC-06: Khi có lỗi tải dữ liệu tạm thời, hệ thống hiện thông báo và có nút thử lại.
- AC-07: Người dùng bấm vào một sản phẩm từ danh sách sẽ mở được trang chi tiết sản phẩm tương ứng.
