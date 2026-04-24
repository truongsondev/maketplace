# Đặc tả Use Case - Xem thống kê danh mục

## 1. Summary

| Trường                    | Nội dung                                                                                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Use Case ID               | UC-CATE-VIEW-STATS                                                                                                                                                  |
| Use Case Name             | Xem thống kê danh mục                                                                                                                                               |
| Use Case Description      | Là Quản trị viên, tôi muốn xem thống kê danh mục để nắm tình hình tổ chức sản phẩm, theo dõi số lượng danh mục và đưa ra quyết định vận hành phù hợp.               |
| Primary Actor             | Quản trị viên                                                                                                                                                       |
| Supporting Actors         | Hệ thống quản trị bán hàng                                                                                                                                          |
| Trigger                   | Quản trị viên mở màn hình Quản lý danh mục và chọn khu vực Thống kê danh mục.                                                                                       |
| Pre-Conditions            | (1) Quản trị viên đã đăng nhập thành công. (2) Tài khoản có quyền xem dữ liệu danh mục. (3) Hệ thống có dữ liệu danh mục hoặc chấp nhận trường hợp chưa có dữ liệu. |
| Post-Conditions (Success) | (1) Hệ thống hiển thị danh sách danh mục và tổng số danh mục. (2) Quản trị viên có thể tiếp tục lọc/tìm kiếm hoặc chuyển sang thao tác quản lý danh mục.            |
| Post-Conditions (Failure) | Không tải được dữ liệu thống kê; hệ thống hiển thị thông báo rõ ràng để quản trị viên thử lại hoặc đăng nhập lại khi cần.                                           |

## 2. Flow

### 2.1 Basic Flow (Xem thống kê mặc định)

1. Quản trị viên đăng nhập vào trang quản trị.
2. Quản trị viên mở màn hình Quản lý danh mục.
3. Quản trị viên chọn khu vực Thống kê danh mục.
4. Hệ thống tải dữ liệu danh mục hiện có.
5. Hệ thống tính và hiển thị tổng số danh mục.
6. Hệ thống hiển thị danh sách danh mục để quản trị viên đối chiếu.
7. Quản trị viên xem kết quả thống kê và đưa ra quyết định quản lý tiếp theo.

### 2.2 Alternative Flows

#### A1 - Lọc danh mục theo trạng thái

1. Quản trị viên chọn điều kiện lọc (ví dụ: đang hoạt động, tạm ẩn).
2. Hệ thống cập nhật danh sách và số liệu thống kê theo điều kiện đã chọn.
3. Quản trị viên tiếp tục theo dõi số liệu theo từng trạng thái.

#### A2 - Tìm kiếm nhanh danh mục

1. Quản trị viên nhập từ khóa tên danh mục.
2. Hệ thống hiển thị các danh mục phù hợp với từ khóa.
3. Hệ thống đồng thời cập nhật số lượng kết quả đang hiển thị.

#### A3 - Không có dữ liệu danh mục

1. Quản trị viên mở màn hình thống kê khi chưa có danh mục nào.
2. Hệ thống hiển thị tổng số danh mục bằng 0.
3. Hệ thống hiển thị thông báo chưa có dữ liệu và gợi ý tạo danh mục mới.

### 2.3 Exception Flows

#### E1 - Lỗi tải dữ liệu tạm thời

- Điều kiện: Hệ thống gặp lỗi kết nối hoặc dịch vụ dữ liệu tạm thời gián đoạn.
- Hệ thống: Hiển thị thông báo hệ thống đang bận và cung cấp nút thử lại.
- Kết quả: Quản trị viên có thể thử tải lại thống kê.

#### E2 - Phiên làm việc không còn hiệu lực

- Điều kiện: Quản trị viên mở thống kê khi phiên đăng nhập đã hết hiệu lực.
- Hệ thống: Chuyển quản trị viên về màn hình đăng nhập và thông báo cần đăng nhập lại.
- Kết quả: Sau khi đăng nhập lại thành công, quản trị viên quay về màn hình thống kê.

#### E3 - Tài khoản không có quyền xem thống kê

- Điều kiện: Tài khoản không thuộc nhóm được phép xem thống kê danh mục.
- Hệ thống: Từ chối truy cập và hiển thị thông báo không đủ quyền.
- Kết quả: Quản trị viên liên hệ người phụ trách để được cấp quyền phù hợp.

## 3. Additional Information

### 3.1 Business Rules

- BR-01: Chỉ tài khoản có quyền quản trị danh mục mới được xem thống kê danh mục.
- BR-02: Số liệu tổng danh mục phải đồng nhất với danh sách danh mục đang hiển thị.
- BR-03: Khi áp dụng lọc hoặc tìm kiếm, số liệu phải cập nhật theo đúng điều kiện đã chọn.
- BR-04: Khi chưa có dữ liệu, hệ thống vẫn phải hiển thị màn hình thống kê với giá trị 0 rõ ràng.
- BR-05: Thông báo lỗi phải ngắn gọn, dễ hiểu, không hiển thị thông tin kỹ thuật nội bộ.

### 3.2 Non-Functional Requirements

- NFR-01: Thời gian tải dữ liệu thống kê ban đầu không vượt quá 3 giây trong điều kiện mạng bình thường.
- NFR-02: Thao tác lọc/tìm kiếm cập nhật kết quả trong mục tiêu dưới 2 giây với dữ liệu thông thường.
- NFR-03: Màn hình thống kê hiển thị tốt trên desktop và tablet (độ phân giải phổ biến của trang quản trị).
- NFR-04: Khi lỗi xảy ra, người dùng luôn có cách thao tác tiếp theo rõ ràng (thử lại hoặc đăng nhập lại).

### 3.3 Acceptance Criteria

- AC-01: Quản trị viên đăng nhập hợp lệ có thể mở màn hình Xem thống kê danh mục.
- AC-02: Hệ thống hiển thị được danh sách danh mục và tổng số danh mục tương ứng.
- AC-03: Khi áp dụng bộ lọc trạng thái, danh sách và số lượng kết quả thay đổi đúng theo lựa chọn.
- AC-04: Khi tìm kiếm theo từ khóa, hệ thống trả về đúng các danh mục phù hợp.
- AC-05: Khi chưa có dữ liệu danh mục, hệ thống hiển thị số liệu 0 và thông báo hướng dẫn phù hợp.
- AC-06: Khi xảy ra lỗi tải dữ liệu tạm thời, hệ thống hiển thị thông báo và cho phép thử lại.
- AC-07: Khi tài khoản không đủ quyền, hệ thống chặn truy cập và hiển thị thông báo phù hợp.
