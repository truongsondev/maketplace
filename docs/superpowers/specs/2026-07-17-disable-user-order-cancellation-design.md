# Tắt chức năng hủy đơn của user và giảm giá theo hạng

## Mục tiêu

- Tạm khóa toàn bộ khả năng hủy đơn từ phía user.
- Không áp dụng giảm giá theo hạng thành viên tại checkout.
- Giữ nguyên việc tích điểm, lịch sử điểm và nâng hạng thành viên.
- Không ảnh hưởng đến nghiệp vụ hủy đơn của admin/seller hoặc đổi/trả hàng.

## Thiết kế

### Khóa hủy đơn của user

Backend khai báo một hằng số dùng chung `USER_ORDER_CANCELLATION_ENABLED = false`. Đây là nguồn quyết định duy nhất cho trạng thái bật/tắt chức năng.

Hai API phía user đều phải kiểm tra hằng số trước khi xử lý:

- Hủy trực tiếp đơn chưa thanh toán.
- Gửi yêu cầu hủy đơn đã thanh toán để admin duyệt.

Khi chức năng bị tắt, API trả lỗi nghiệp vụ rõ ràng và không tạo thay đổi trạng thái đơn, yêu cầu hủy, hoàn tiền, tồn kho hoặc audit log.

Danh sách và chi tiết đơn của user nhận trạng thái cho phép hủy từ backend. Frontend chỉ hiển thị nút `Hủy đơn` hoặc `Yêu cầu hủy` khi trạng thái này được bật và đơn thỏa điều kiện hiện có. Vì vậy frontend không cần khai báo thêm một biến bật/tắt độc lập.

Admin/seller vẫn có thể hủy đơn và tiếp tục xử lý các yêu cầu hủy đã tồn tại trước khi khóa. Chức năng đổi/trả hàng của user không thay đổi.

### Tắt giảm giá theo hạng tại checkout

Hàm tính giảm giá loyalty dùng chung vẫn trả đúng hạng và nhãn hạng, nhưng phần trăm và số tiền giảm luôn bằng `0` tại luồng checkout.

Các phép tính preview checkout, kiểm tra voucher và tạo thanh toán tiếp tục dùng chung kết quả backend, nên tổng tiền không thể bị lệch giữa giao diện và đơn hàng. Khuyến mãi và voucher vẫn áp dụng theo quy tắc hiện tại.

Việc cộng điểm khi đơn hoàn tất, cập nhật số dư, lịch sử giao dịch điểm và nâng hạng không thay đổi.

## Dòng dữ liệu

1. User tải danh sách hoặc chi tiết đơn.
2. Backend trả dữ liệu đơn cùng trạng thái `userOrderCancellationEnabled` lấy từ hằng số dùng chung.
3. Frontend ẩn các thao tác hủy khi trạng thái là `false`.
4. Nếu client cũ hoặc request thủ công gọi API hủy, backend vẫn từ chối trước khi chạy nghiệp vụ.
5. Khi checkout, backend tính khuyến mãi và voucher như hiện tại, sau đó trả giảm giá theo hạng bằng `0`.

## Xử lý lỗi

- API hủy từ phía user trả lỗi nghiệp vụ thống nhất: `Chức năng hủy đơn hiện đang tạm khóa`.
- Không thay đổi cấu trúc hoặc dữ liệu của những yêu cầu hủy đã có.
- Không dùng `.env`, migration hoặc cấu hình database cho thay đổi này.

## Kiểm thử

- Kiểm tra cả hai API hủy của user bị từ chối khi hằng số là `false`.
- Kiểm tra response danh sách và chi tiết đơn báo chức năng hủy đang tắt.
- Kiểm tra giao diện danh sách và chi tiết không hiển thị nút hủy/yêu cầu hủy.
- Kiểm tra checkout hạng Bạc/Vàng có giảm giá loyalty bằng `0`, kể cả khi có voucher.
- Kiểm tra voucher và khuyến mãi vẫn được tính đúng.
- Kiểm tra nghiệp vụ cộng điểm khi hoàn tất đơn không bị thay đổi.
- Chạy test, lint và build liên quan của server và `client-next`.

