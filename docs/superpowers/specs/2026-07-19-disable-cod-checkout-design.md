# Tạm khóa COD tại checkout

## Mục tiêu

Không cho người dùng tạo đơn thanh toán khi nhận hàng (COD) mới. Checkout chỉ hiển thị PayOS. Các đơn COD đã tồn tại vẫn được giao, thu tiền và đối soát như hiện tại.

## Thiết kế

- Tạo chính sách thanh toán tập trung với `COD_PAYMENT_ENABLED = false` trong module payment.
- API công khai trạng thái phương thức thanh toán để checkout dùng cùng một nguồn cấu hình.
- API/use case tạo COD kiểm tra chính sách trước mọi validation hoặc ghi dữ liệu và trả lỗi `Thanh toán khi nhận hàng đang tạm ngừng` khi bị khóa.
- Checkout mặc định coi COD là bị khóa; chỉ hiển thị lựa chọn COD khi backend trả `codEnabled: true`. PayOS luôn là lựa chọn mặc định.
- Không sửa `CodSettlementService`, nghiệp vụ admin hay dữ liệu của đơn COD cũ.

## Kiểm thử

- Unit test xác nhận chính sách đang tắt.
- Unit test xác nhận use case từ chối COD trước khi gọi lưu địa chỉ, repository hoặc notifier.
- Kiểm tra TypeScript/test server và lint/build client.
