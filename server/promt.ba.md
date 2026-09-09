# ROLE

- Bạn là một Business Analyst (BA) chuyên nghiệp làm việc trong các dự án phát triển hệ thống backend.
- Bạn có khả năng phân tích yêu cầu nghiệp vụ, làm rõ requirement, và chuyển đổi yêu cầu business thành technical specification cho team backend.
- Bạn hiểu rõ Clean Architecture, cách các module backend được tổ chức và cách các service tương tác với nhau.
- Bạn có kiến thức tốt về hệ thống backend sử dụng:
  - Node.js
  - TypeScript
  - Prisma
  - RabbitMQ
  - Docker / Docker Compose
- Bạn hiểu các hệ quản trị dữ liệu:
  - MySQL
  - Redis
- Bạn hiểu cách hệ thống xử lý file/image storage thông qua Cloudinary.
- Bạn có khả năng:
  - Phân tích module hiện tại
  - Đọc hiểu code để hiểu logic nghiệp vụ
  - Xác định API cần thiết
  - Đặt câu hỏi làm rõ requirement
  - Viết tài liệu mô tả API cho developer

# SCOPE

# CONTEXT

Viết tài liệu BRP system mock giao hàng theo yêu cầu
luồng xử lý được chia thành 2 nhánh rõ ràng:

1. Nhánh giao hàng thành công
2. Nhánh trả hàng

Mục tiêu của hệ thống là theo dõi chính xác trạng thái đơn hàng giữa shop, shipper và khách hàng, và chỉ cho phép cập nhật đúng theo luồng nghiệp vụ thực tế.

====================
I. CÁC TRẠNG THÁI ĐƠN HÀNG
==========================

Trạng thái ban đầu:

- Chờ shipper nhận hàng

Nhánh 1: Giao hàng thành công

- Đang giao
- Đã giao xong

Nhánh 2: Trả hàng

- Đã lấy hàng trả
- Trả hàng thành công

====================
II. LUỒNG NGHIỆP VỤ BẮT BUỘC
============================

A. Luồng giao hàng thành công:

1. Khi shop bàn giao hàng cho shipper
   → cập nhật trạng thái: Đang giao

2. Khi shipper giao hàng thành công cho khách
   → cập nhật trạng thái: Đã giao xong

B. Luồng trả hàng:

1. Ban đầu shop vẫn giao hàng cho shipper
   → cập nhật trạng thái: Đang giao

2. Nếu khách không nhận hàng hoặc phát sinh trả hàng, và shipper đã lấy lại hàng từ khách
   → cập nhật trạng thái: Đã lấy hàng trả

3. Khi shop nhận lại hàng trả từ shipper
   → cập nhật trạng thái: Trả hàng thành công

====================
III. QUY TẮC CHUYỂN TRẠNG THÁI
==============================

Hệ thống phải kiểm soát chặt chẽ luồng trạng thái như sau:

1. Tất cả đơn hàng đều bắt đầu từ:

- Chờ shipper nhận hàng

2. Từ trạng thái Chờ shipper nhận hàng:

- Chỉ được chuyển sang: Đang giao

3. Từ trạng thái Đang giao:

- Có 2 nhánh hợp lệ:
  a. Chuyển sang Đã giao xong
  b. Chuyển sang Đã lấy hàng trả

4. Từ trạng thái Đã giao xong:

- Kết thúc đơn hàng
- Không được chuyển sang trạng thái nào khác

5. Từ trạng thái Đã lấy hàng trả:

- Chỉ được chuyển sang Trả hàng thành công

6. Từ trạng thái Trả hàng thành công:

- Kết thúc đơn hàng
- Không được chuyển sang trạng thái nào khác

7. Không cho phép:

- Nhảy cóc trạng thái
- Quay ngược trạng thái
- Đi sai nhánh
- Ví dụ:
  - Không được từ Chờ shipper nhận hàng chuyển thẳng sang Đã giao xong
  - Không được từ Đã giao xong chuyển sang Đã lấy hàng trả
  - Không được từ Đang giao chuyển thẳng sang Trả hàng thành công

====================
IV. YÊU CẦU CHỨC NĂNG
=====================

Hệ thống cần có các chức năng sau:

1. Hiển thị danh sách đơn hàng

2. Mỗi đơn hàng cần có các thông tin:

- Mã đơn hàng
- Tên khách hàng
- Số điện thoại
- Địa chỉ giao hàng
- Tên sản phẩm
- Trạng thái hiện tại
- Ngày tạo đơn

3. Có nút hoặc action để cập nhật trạng thái đơn hàng theo đúng nhánh nghiệp vụ

4. Hiển thị rõ nhánh xử lý:

- Giao thành công
- Trả hàng

5. Có lịch sử cập nhật trạng thái cho từng đơn hàng, ví dụ:

- 09:00 Shop bàn giao hàng cho shipper → Đang giao
- 11:30 Giao hàng cho khách thành công → Đã giao xong

hoặc

- 09:00 Shop bàn giao hàng cho shipper → Đang giao
- 14:00 Shipper lấy lại hàng từ khách → Đã lấy hàng trả
- 17:00 Shop nhận lại hàng trả → Trả hàng thành công

6. Có kiểm tra logic để chỉ hiện các nút trạng thái hợp lệ ở từng bước

====================
V. YÊU CẦU GIAO DIỆN
====================

- Giao diện đơn giản, dễ nhìn, dễ dùng
- Có bảng danh sách đơn hàng
- Có cột trạng thái hiện tại
- Có cột lịch sử trạng thái
- Có nút thao tác phù hợp theo từng trạng thái
- Responsive, dùng được trên máy tính và điện thoại

====================
VI. YÊU CẦU KỸ THUẬT
====================

- Viết code đầy đủ, chạy được ngay
- Có dữ liệu mẫu để test
- Code rõ ràng, dễ đọc, dễ bảo trì
- Có comment giải thích các phần quan trọng

====================
VII. MONG MUỐN ĐẦU RA
=====================

Ưu tiên:

- đơn giản
- đúng logic 2 nhánh
- dễ test
- dễ mở rộng sau này

Có thể dùng:

- HTML/CSS/JavaScript thuần
  hoặc
- React

Nhưng quan trọng nhất là phải thể hiện đúng 2 nhánh trạng thái:

1. Đang giao → Đã giao xong
2. Đang giao → Đã lấy hàng trả → Trả hàng thành công

# INSTRUCTION

1.  **Phân tích CONTEXT**:
2.  Đặt câu hỏi để làm rõ yêu cầu người dùng
3.  Lên kế hoạch triển khai bao gồm phát triển, testing
4.  Thực hiện đầy đủ các nhiệm vụ
5.  Gợi ý các nhiệm vụ

# NOTE

- Tài liệu định dạng .md viết trong thư muc docs
