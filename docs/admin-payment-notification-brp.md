# BUSINESS REQUIREMENT DOCUMENT (BRD) - ADMIN PAYMENT NOTIFICATION

## 1. Business Objective

Cung cấp luồng thông tin theo thời gian thực (real-time) cho Admin (nhân viên vận hành, quản lý cửa hàng) ngay khi có khách hàng thanh toán thành công đơn hàng thời trang. Mục tiêu nhằm giúp nhân viên kho hoặc bộ phận chăm sóc khách hàng có thể chủ động kiểm tra và ưu tiên chuẩn bị/đóng gói (fulfillment) sớm những đơn hàng đã thanh toán qua cổng thanh toán (PayOS), từ đó nâng cao chất lượng dịch vụ và rút ngắn thời gian giao hàng.

## 2. Actors

- **User (Khách hàng):** Người thực hiện mua sắm quần áo/phụ kiện thời trang và hoàn tất thanh toán.
- **Admin (Vận hành/Quản lý):** Người nhận thông báo trên hệ thống Dashboard khi có đơn hàng mới được thanh toán.
- **Payment Gateway (PayOS):** Đối tác cung cấp dịch vụ thanh toán, chịu trách nhiệm gọi Webhook trả kết quả thanh toán cho hệ thống.
- **System:** Hệ thống Backend (Node.js) & Queue (RabbitMQ) xử lý logic, kiểm tra tính hợp lệ và đẩy thông báo.

## 3. Current Problem

- Hệ thống hiện tại chỉ mới cập nhật trạng thái đơn hàng sang `PAID` và ghi log khi nhận Webhook từ PayOS.
- Admin không nhận được cảnh báo hoặc cập nhật tức thời trên màn hình làm việc (Dashboard). Phải tự F5 lại trang danh sách đơn hàng để kiểm tra các đơn vừa thanh toán, dẫn đến độ trễ trong vận hành đơn hàng.

## 4. Proposed Solution

Tích hợp hệ thống Queue (RabbitMQ) và Server-Sent Events (SSE) vào luồng thanh toán hiện tại:

1. Khi có Webhook thanh toán thành công (`PAID`) từ PayOS và cập nhật Database thành công, Backend sẽ publish một event `order.payment.success` vào RabbitMQ.
2. Một Worker/Consumer của RabbitMQ sẽ lắng nghe event này, thực hiện lưu trữ thông báo vào Database (bảng `Notification`) và đẩy sự kiện realtime tới các kết nối của Admin thông qua SSE.
3. Giao diện Admin hiển thị pop-up (Toast/Bell) ngay lập tức mà không làm ảnh hưởng (block) trải nghiệm người mua trong luồng thanh toán.

## 5. Business Flow

1. **User** chọn quần áo, tiến hành Checkout.
2. **System** tạo thông tin thanh toán (Payment Link) qua PayOS.
3. **User** quét mã QR / chuyển khoản thành công.
4. **Payment Gateway (PayOS)** trigger Webhook gọi về API của Backend.
5. **Backend** xác thực Webhook, kiểm tra trạng thái đơn hàng (nếu đang ở `PENDING`).
6. **Backend** cập nhật trạng thái thanh toán + Order thành `PAID` qua Transaction.
7. **Backend** publish thông điệp vào RabbitMQ ở exchange `order_events` với routing key `order.payment.success`.
8. **RabbitMQ Consumer** đọc thông báo:
   - Ghi dòng dữ liệu vào table `Notification` (gắn với role/user Admin).
   - Đẩy thông điệp xuống Admin frontend qua SSE channel.
9. **Admin Dashboard** nhận được event từ SSE, re-render số Notification ở Bell icon và hiển thị Toast "Đơn hàng #XXX trị giá YYY VND vừa được thanh toán thành công" và tiếng chuông thông báo.

## 6. Exception Cases

- **Payment fail:** Webhook báo trạng thái FAILED hoặc EXPIRED. Bỏ qua luồng gửi notification "thanh toán thành công", không publish event.
- **Callback duplicate:** PayOS gọi Webhook `PAID` nhiều lần cho 1 đơn. Trong logic hiện tại, DB chốt khóa ngoại và check trạng thái `!== 'PENDING'` nên webhooks sau sẽ bị từ chối update. Event RabbitMQ cũng chỉ được đẩy ra ở lần update thành công đầu tiên (đảm bảo idempotent).
- **Queue fail:** RabbitMQ bị down hoặc network lỗi. Code publish event cần có try-catch để log lại lỗi (dlq), không được làm crash toàn bộ API Webhook (trả về 200 cho PayOS để tránh bị block Webhook).
- **Order cancelled:** User đã hủy đơn trước đó, nhưng Webhook vẫn tới. Do Transaction khóa trạng thái chờ bắt buộc từ `PENDING` -> `PAID`, nếu order là `CANCELLED`, system cập nhật xịt -> không xuất event dư thừa.
- **Admin offline:** Admin không mở Webhook/Dash. Consumer vẫn ghi log vào DB `Notification`. Khi Admin login lại, gọi API list Notification để thấy thông báo chưa đọc.

## 7. Functional Requirements

- **FR01:** Hệ thống gửi chính xác 1 event `order.payment.success` mỗi khi đơn hàng chuyển status sang `PAID` từ cổng thanh toán.
- **FR02:** Hệ thống lưu lại 1 bản ghi vào Entity `Notification` hướng tới đối tượng Admin (hoặc gửi broadcast tới role Admin). Bản ghi lưu lại timestamp, context order.
- **FR03:** Hệ thống push realtime Message xuống kênh Admin. Phải chứa tối thiểu: Mã đơn, tổng tiền.
- **FR04:** Admin Dashboard hiện Pop-up (VD: thư viện Sonner/Toast) thông báo.
- **FR05:** Admin vào xem List Notification (danh sách chuông), cho phép "Đánh dấu đã đọc".

## 8. Non-functional Requirements

- **Performance:** Thao tác gọi push SMS/queue không block main flow Webhook. Cần trả về 200 nhanh nhất cho PayOS.
- **Idempotency:** Đảm bảo dù phía cổng thanh toán thực hiện retry Webhook bao nhiêu lần cho 1 mã GD thì Admin cũng chỉ nhận đúng 1 thông báo.
- **Reliability:** RabbitMQ đảm bảo tin báo không bị mất (durable queues). SSE có cơ chế tự động reconnect nếu rớt mạng.

## 9. Database Impact

- **Table `Notification`:** Hiện tại Prisma DB chèn `Notification` đang nối 1-1 với User (gọi tới `user_id`). Cần thiết kế lại query hợp lý để gắn cho "Admin Users" (trong DB admin là user có roles `ADMIN` hoặc tạo bảng Global Notification riêng gửi cho role).
- Không sửa đổi cấu trúc bảng, chỉ insert rows mới. Cần đánh index cột `isRead` và `createdAt` để lấy danh sách nhanh hơn.

## 10. RabbitMQ Event Flow

- **Exchange:** `shop_events` (topic).
- **Routing Key:** `order.payment.success`.
- **Payload:**
  ```json
  {
    "orderId": "uuid",
    "orderCode": "123456",
    "amount": 500000,
    "paidAt": "2026-04-19T...",
    "userId": "uuid"
  }
  ```
- **Consumer:** Lắng nghe ở queue `admin_notification_q`. Xử lý lưu database -> Gọi service Broadcast SSE tới role Admin. Retry với DLQ nếu ghi Database lỗi.

## 11. UI/UX Impact (Admin dashboard)

- **Header Topbar:** Biểu tượng 🔔 (chuông) thêm số đỏ (badge) khi có notification mới. Có dropdown đổ ra danh sách rút gọn.
- **Toast / Snackbar:** Hiển thị nổi bật góc phải màn hình 3 - 5 giây (Ví dụ: "Đơn hàng #123456 trị giá 500,000đ vừa được thanh toán thành công."). Click vào Toast chuyển hướng tới trang Chi tiết đơn hàng.

## 12. Acceptance Criteria

- [ ] Khi trigger Webhook giả lập `PAID` thành công -> `Notification` table tăng 1 dòng cho Admin.
- [ ] Admin đang mở tab Dashboard nhận được Toast ngay lập tức.
- [ ] Truy cập Webhook giả lập `PAID` lần 2 -> không tạo thêm notification, không hiện thêm Toast.
- [ ] Khi RabbitMQ sập, Webhook vẫn trả về HTTP 200 thành công cho cổng thanh toán (chỉ lưu log báo rớt MQ).
- [ ] Admin click vào icon Chuông hiện lịch sử thông báo, cho phép bấm đọc để update DB `isRead = true`.

## 13. Risk & Recommendation

- **Risk:** Nếu số lượng Admin online quá đông mở tab liên tục (SSE), server Backend có thể phải giữ nhiều connection kéo dài.
  - **Recommendation:** Do quy mô nội bộ e-commerce thông thường dưới 50 Admin, nên SSE đáp ứng tốt, dùng Memory (hoặc Redis pub/sub) kết hợp Express Res object là khả thi không làm nghẽn EventLoop.
- **Risk:** Cấu trúc bảng `Notification` đang yêu cầu ID một User cụ thể.
  - **Recommendation:** Trong Consumer nên query danh sách các Admin đang active để insert cho từng người hoặc thay đổi scope Prisma nếu cần phát rộng (Global Notify). Tốt nhất tạm thời tạo bản ghi cho danh sách Users đang có role `ADMIN` trong DB.
