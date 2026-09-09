# Xuất toàn bộ đơn hàng admin sang XLSX theo nhóm email

## Mục tiêu

- Mỗi lần admin bấm xuất đơn hàng, xuất toàn bộ đơn hàng hiện có trong database.
- Gom các đơn của cùng một email thành một nhóm liền nhau.
- Trong mỗi nhóm email, đơn mới nhất nằm trước.
- Tô nền xen kẽ theo nhóm email để dễ phân biệt khách hàng.
- Toàn bộ tiêu đề và dữ liệu diễn giải dùng tiếng Việt có dấu, không lỗi font.

## Phạm vi

Thay chức năng xuất đơn hiện tại từ CSV sang XLSX. Danh sách đơn trên màn hình và các bộ lọc vẫn hoạt động như cũ, nhưng không ảnh hưởng đến dữ liệu xuất. Endpoint xuất bỏ giới hạn 10.000 bản ghi và không áp dụng tab, tìm kiếm, ngày, loại yêu cầu, trạng thái yêu cầu hoặc thứ tự đang chọn trên giao diện.

## Truy vấn và thứ tự

Endpoint xuất lấy toàn bộ đơn hàng với các quan hệ cần thiết để dựng file. Thứ tự chính là email người đặt tăng dần; thứ tự phụ trong cùng email là thời gian tạo giảm dần; `id` giảm dần được dùng làm khóa ổn định khi hai đơn có cùng thời gian.

Không phân trang và không đặt `take`. Mỗi đơn hàng tạo đúng một dòng trong worksheet.

## Cấu trúc file XLSX

File có một worksheet tên `Đơn hàng`. Các cột:

1. Mã đơn nội bộ
2. Mã thanh toán
3. Ngày đặt
4. Trạng thái đơn
5. Tổng tiền
6. Email khách hàng
7. Số điện thoại
8. Phương thức thanh toán
9. Trạng thái thanh toán
10. Trạng thái giao dịch
11. Số loại sản phẩm
12. Chi tiết sản phẩm

Tiêu đề cột in đậm. Ngày đặt dùng kiểu ngày giờ Excel và định dạng `dd/mm/yyyy hh:mm:ss`. Tổng tiền dùng kiểu số với phân tách hàng nghìn. Các mã trạng thái đơn, phương thức và trạng thái thanh toán được ánh xạ sang tiếng Việt; mã lạ có giá trị dự phòng tiếng Việt thay vì làm hỏng file.

Tên file có dạng `danh-sach-don-hang-YYYY-MM-DD.xlsx`. API trả MIME type XLSX và client tải xuống với phần mở rộng `.xlsx`.

## Màu nhóm email

Các dòng dữ liệu được chia nhóm theo email đã sắp xếp. Nhóm thứ nhất dùng nền hồng nhạt, nhóm thứ hai không tô nền, nhóm thứ ba lại dùng nền hồng nhạt và tiếp tục xen kẽ. Tất cả đơn của cùng email luôn có cùng kiểu nền.

Màu chỉ áp dụng cho dòng dữ liệu, không phụ thuộc số lượng đơn trong nhóm. Hàng tiêu đề dùng kiểu riêng và không tham gia chu kỳ màu.

## Kiến trúc

- Thêm thư viện tạo workbook XLSX phía server.
- Tách phần dựng workbook thành module thuần, nhận danh sách đơn đã sắp xếp và trả về `Buffer`.
- Admin orders API chịu trách nhiệm truy vấn toàn bộ dữ liệu, gọi workbook builder và trả response.
- Client seller chỉ gọi endpoint không kèm bộ lọc và đổi tên file/thông báo từ CSV sang XLSX.

## Xử lý lỗi

- Nếu database không có đơn hàng, vẫn trả file XLSX hợp lệ chỉ có hàng tiêu đề.
- Giá trị null được xuất thành ô trống.
- Nội dung sản phẩm giữ nguyên tiếng Việt và ký tự đặc biệt trong ô XLSX, không dùng escape CSV.
- Lỗi tạo workbook hoặc truy vấn tiếp tục đi qua middleware lỗi hiện tại; client hiển thị thông báo xuất XLSX thất bại.

## Kiểm thử

- Kiểm tra endpoint truy vấn không có `where`, `take` hoặc phân trang và dùng thứ tự email tăng dần, ngày tạo giảm dần, id giảm dần.
- Kiểm tra workbook có đúng worksheet, tiêu đề tiếng Việt và số dòng bằng số đơn đầu vào.
- Kiểm tra các đơn cùng email nằm liền nhau và giữ thứ tự mới đến cũ.
- Kiểm tra hai nhóm email liền kề có kiểu nền khác nhau; các dòng cùng nhóm có cùng nền.
- Kiểm tra đọc lại workbook vẫn giữ nguyên chuỗi tiếng Việt có dấu.
- Kiểm tra trạng thái, phương thức thanh toán và ngày giờ được chuẩn hóa đúng.
- Chạy test server, TypeScript, build server và build client seller.

