# Prompt cải thiện hệ thống Aura Fashion Store

````text
Bạn là Senior Business Analyst, Solution Architect và Senior Full-stack Engineer chuyên xây dựng hệ thống thương mại điện tử thời trang.

Hãy phân tích và cải thiện dự án trong repository hiện tại theo đúng mô hình kinh doanh được mô tả dưới đây. Sau khi khảo sát, hãy trực tiếp triển khai từng giai đoạn, kiểm thử và báo cáo kết quả; không chỉ dừng ở việc viết tài liệu hoặc đề xuất.

## 1. Bối cảnh kinh doanh đã chốt

Đây là hệ thống bán hàng của một shop thời trang nhỏ, không phải marketplace.

Các đặc điểm cố định:

- Shop chỉ có một chủ sở hữu và tự bán toàn bộ sản phẩm.
- Shop có website bán hàng và một cửa hàng vật lý.
- Chỉ có duy nhất một chi nhánh, không có kế hoạch quản lý nhiều chi nhánh trong phạm vi hiện tại.
- Website và cửa hàng vật lý dùng chung một nguồn tồn kho.
- Tất cả đơn hàng online đều được miễn phí vận chuyển.
- `shippingFee` luôn bằng 0 và phải được lưu rõ ràng trên đơn hàng để phục vụ đối soát.
- Không cần bảng giá vận chuyển theo tỉnh, khối lượng hoặc giá trị đơn.
- Không có nghiệp vụ bảo hành.
- Nếu sản phẩm bị lỗi, khách hàng thực hiện trả hàng và được hoàn lại toàn bộ số tiền hợp lệ của sản phẩm bị lỗi.
- Có thể hỗ trợ đổi size/màu nếu sản phẩm còn hàng và đáp ứng chính sách đổi hàng.
- Không xây dựng seller, gian hàng, hoa hồng, ví seller, payout hoặc đối soát nhiều người bán.
- Không xây dựng warehouse phức tạp hoặc điều chuyển giữa nhiều kho.

Tên và cách mô tả phù hợp của hệ thống là `Aura Fashion Store`, `Fashion Commerce` hoặc `Online Fashion Store`, không gọi là marketplace nếu source chưa có nghiệp vụ marketplace thực sự.

## 2. Công nghệ hiện tại

- Backend: Node.js, Express, TypeScript, Prisma, MySQL, Redis và RabbitMQ.
- Website khách hàng: Next.js, React, TypeScript và Tailwind CSS.
- Trang quản trị: Vite, React, TypeScript và Tailwind CSS.
- AI service: FastAPI, recommendation và virtual try-on.
- Thanh toán online: PayOS.
- Backend đang tổ chức theo module và định hướng Clean Architecture.

Hãy giữ lại kiến trúc và convention hiện có nếu chúng vẫn phù hợp.

## 3. Quy tắc làm việc bắt buộc

1. Đọc `README.md`, Prisma schema, migrations, API docs và source của các module liên quan trước khi sửa.
2. Chạy `git status` và bảo toàn toàn bộ thay đổi hiện có của người dùng.
3. Không xóa, hoàn tác hoặc ghi đè thay đổi ngoài phạm vi công việc.
4. Không viết lại toàn bộ dự án nếu có thể mở rộng module hiện tại.
5. Business rule quan trọng phải được kiểm tra tại backend, không chỉ tại frontend.
6. Không tin số tiền, giảm giá, phí giao hàng, trạng thái thanh toán hoặc tổng đơn do frontend gửi lên. Backend phải tự tính lại.
7. Thay đổi liên quan đến tồn kho, đơn hàng, voucher, thanh toán và hoàn tiền phải dùng transaction khi cần và bảo đảm idempotency.
8. Mọi thay đổi database phải có Prisma migration và kế hoạch tương thích/backfill dữ liệu cũ.
9. Không hardcode chính sách cần quản trị, ngoại trừ chính sách đã chốt là toàn bộ đơn hàng miễn phí vận chuyển.
10. Không lưu dữ liệu nhạy cảm không cần thiết vào log, notification hoặc audit log.
11. Viết unit test và integration test cho các rule nghiệp vụ quan trọng.
12. Sau mỗi phase phải chạy test, lint và build phù hợp với phạm vi thay đổi.
13. Không tự thêm nghiệp vụ nhiều chi nhánh, marketplace, phí ship hoặc bảo hành.
14. Nếu phát hiện tài liệu/source cũ mâu thuẫn với bối cảnh đã chốt trong prompt này, bối cảnh trong prompt này được ưu tiên.

## 4. Phase 0 — Khảo sát và lập kế hoạch

Trước khi chỉnh sửa source, hãy:

1. Lập bản đồ các module:
   - auth và user;
   - address;
   - product, category, attribute và variant;
   - inventory;
   - cart;
   - voucher/promotion;
   - checkout và payment;
   - order;
   - delivery;
   - exchange, return và refund;
   - loyalty;
   - review;
   - recommendation, chatbot và virtual try-on;
   - admin dashboard và audit log.
2. Mô tả state machine hiện tại của Order, Payment, Return và Refund.
3. Kiểm tra cách hệ thống:
   - lưu địa chỉ giao hàng;
   - tính subtotal, voucher và grand total;
   - giữ và trừ tồn kho;
   - xử lý PayOS webhook;
   - hủy đơn;
   - trả hàng và hoàn tiền.
4. Chỉ ra nguy cơ race condition, overselling, xử lý webhook lặp và sai lệch tồn kho.
5. Xác định những tên gọi hoặc tài liệu đang mô tả sai hệ thống là marketplace.
6. Trình bày kế hoạch ngắn gọn, model/API/file dự kiến thay đổi và rủi ro trước khi bắt đầu Phase 1.

Sau khi hoàn thành khảo sát, hãy trực tiếp triển khai theo thứ tự ưu tiên bên dưới.

## 5. Phase 1 — Lưu snapshot thông tin giao hàng trên từng đơn

Đây là yêu cầu ưu tiên cao nhất.

Không được lấy địa chỉ mới nhất trong hồ sơ khách hàng để hiển thị hoặc xử lý một đơn hàng cũ. Mỗi đơn phải lưu snapshot bất biến tại thời điểm checkout.

### Yêu cầu

1. Tạo `OrderShippingAddress` quan hệ 1-1 với `Order`, hoặc thiết kế snapshot tương đương phù hợp với schema hiện tại.
2. Snapshot tối thiểu gồm:
   - recipientName;
   - phone;
   - addressLine;
   - ward;
   - district;
   - province/city;
   - sourceAddressId nếu địa chỉ được chọn từ sổ địa chỉ.
3. Snapshot phải được tạo trong cùng transaction tạo Order.
4. Khách sửa hoặc xóa `UserAddress` không được làm thay đổi đơn đã đặt.
5. API chi tiết đơn của khách và API admin phải trả về snapshot này.
6. Loại bỏ logic dùng `LATEST_USER_ADDRESS` làm địa chỉ giao hàng của đơn cũ.
7. Đơn hiện có phải có chiến lược backfill an toàn. Nếu không thể khôi phục địa chỉ lịch sử chính xác, phải đánh dấu rõ nguồn dữ liệu legacy thay vì giả vờ đó là snapshot chính xác.

### Test bắt buộc

- Khách đặt đơn bằng địa chỉ A.
- Sau đó khách sửa địa chỉ hồ sơ thành B.
- Đơn cũ vẫn hiển thị địa chỉ A cho cả khách hàng và admin.

## 6. Phase 2 — Giao hàng miễn phí và thông tin vận chuyển tối giản

Shop miễn phí giao hàng cho toàn bộ đơn, vì vậy không xây dựng bảng giá vận chuyển phức tạp.

### Yêu cầu

1. Backend luôn tự xác định `shippingFee = 0`.
2. Không nhận hoặc không tin `shippingFee` do frontend gửi lên.
3. Lưu `shippingFee = 0` trong snapshot giá của Order để việc đối soát rõ ràng.
4. Công thức tổng tiền:

   subtotal
   - productDiscount
   - voucherDiscount
   + shippingFee (luôn bằng 0)
   = grandTotal

5. Checkout phải hiển thị rõ `Miễn phí` hoặc `0 ₫` ở mục vận chuyển.
6. Hóa đơn/chi tiết đơn phải hiển thị breakdown subtotal, discount, shipping fee và grand total.
7. Chỉ cần thông tin vận chuyển tối thiểu:
   - carrierName, nullable;
   - trackingCode, nullable;
   - shippedAt;
   - deliveredAt;
   - deliveryNote, nullable.
8. Admin có thể nhập đơn vị vận chuyển và mã vận đơn khi chuyển đơn sang trạng thái đã gửi.
9. Khách có thể xem đơn vị vận chuyển và mã vận đơn.
10. Không xây dựng shipping zone, bảng giá theo tỉnh, trọng lượng, khoảng cách hoặc ngưỡng freeship.

## 7. Phase 3 — Hoàn thiện thanh toán PayOS và bổ sung COD

Hệ thống cần hỗ trợ:

- `PAYOS`: thanh toán QR/chuyển khoản online.
- `COD`: thanh toán khi nhận hàng.

### Nguyên tắc

1. Tách rõ `OrderStatus` và `PaymentStatus`.
2. Dùng enum hoặc value object có kiểm soát cho payment method.
3. Backend tự tính lại số tiền phải thanh toán từ cart item, giá variant, voucher và `shippingFee = 0`.

### PayOS

1. Chỉ webhook hoặc bước đối soát đáng tin cậy mới được đánh dấu thanh toán thành công.
2. Redirect từ frontend không đủ để đánh dấu `PAID`.
3. Webhook gọi lặp phải không tạo thanh toán, trừ tồn hoặc ghi voucher usage nhiều lần.
4. Link thanh toán hết hạn, bị hủy hoặc tạo thất bại phải giải phóng reservation đúng một lần.
5. Hỗ trợ tạo lại link thanh toán cho đơn còn hợp lệ và chưa thanh toán.

### COD

1. COD không tạo PayOS payment transaction.
2. Payment ban đầu là `PENDING` hoặc `UNPAID` theo thiết kế thống nhất.
3. Khi giao hàng và thu tiền thành công, payment chuyển sang `PAID`.
4. Nếu khách từ chối nhận hoặc giao thất bại và đơn bị hủy, tồn kho phải được hoàn lại đúng một lần.
5. Admin phải thấy rõ phương thức và trạng thái thanh toán.

### Test bắt buộc

- PayOS thành công.
- PayOS webhook được gọi lặp.
- Tạo PayOS link thất bại.
- PayOS hết hạn hoặc bị hủy.
- COD được tạo thành công.
- COD giao và thu tiền thành công.
- COD bị hủy hoặc khách không nhận.
- Checkout khi không đủ tồn kho.

## 8. Phase 4 — Chuẩn hóa vòng đời đơn hàng

Thiết kế state machine đơn giản, phù hợp shop một chi nhánh.

Có thể sử dụng flow tương đương:

```text
PENDING_PAYMENT hoặc PENDING_CONFIRMATION
  -> PAID (đối với PayOS)
  -> CONFIRMED
  -> PACKING
  -> SHIPPED
  -> DELIVERED
  -> COMPLETED
```

Các nhánh ngoại lệ:

```text
PENDING/PAID/CONFIRMED -> CANCELLED
SHIPPED -> DELIVERY_FAILED -> SHIPPED hoặc CANCELLED/RETURN_TO_STORE
DELIVERED/COMPLETED -> RETURN_REQUESTED -> RETURNED/REFUNDED
```

Yêu cầu:

1. Quy định rõ transition nào do khách, admin hoặc system thực hiện.
2. Không cho phép nhảy trạng thái trái quy trình.
3. Mỗi transition phải có `OrderStatusHistory` và audit log phù hợp.
4. Hủy đơn đã thanh toán phải tạo refund idempotent.
5. Hủy đơn chưa thanh toán phải giải phóng tồn kho và đóng payment transaction nếu có.
6. Lưu `deliveredAt` đáng tin cậy để tính thời hạn đổi/trả.
7. Không dùng trạng thái Order để thay thế hoàn toàn trạng thái Payment hoặc Return.

## 9. Phase 5 — Đổi size/màu, trả hàng và hoàn tiền

Hệ thống không có bảo hành. Không tạo request type `WARRANTY` và không xây dựng warranty flow.

Chỉ hỗ trợ hai loại yêu cầu:

- `EXCHANGE`: đổi size hoặc màu nếu biến thể thay thế còn hàng và chính sách cho phép.
- `RETURN_REFUND`: trả sản phẩm và hoàn tiền.

### Chính sách sản phẩm lỗi

1. Lỗi sản phẩm sử dụng `RETURN_REFUND` với reason code `DEFECTIVE`.
2. Khi shop xác nhận lỗi hợp lệ, khách được hoàn lại toàn bộ số tiền đã thanh toán hợp lệ của các sản phẩm lỗi được chấp nhận trả.
3. Không chuyển trường hợp lỗi sang bảo hành hoặc sửa chữa.
4. Nếu toàn bộ đơn được xác nhận lỗi và trả lại, hoàn toàn bộ giá trị đã thanh toán của đơn.
5. Vì phí vận chuyển ban đầu bằng 0 nên không có phí ship ban đầu cần hoàn.
6. Không tự khấu trừ phí xử lý khỏi tiền hoàn cho sản phẩm lỗi.

### Yêu cầu chung

1. Khách phải chọn cụ thể:
   - orderItemId;
   - quantity;
   - requestType;
   - reasonCode;
   - ghi chú;
   - variant mong muốn nếu đổi hàng;
   - ảnh bằng chứng khi rule yêu cầu.
2. Không mặc định tạo return cho toàn bộ item trong đơn.
3. Không cho tổng quantity đang yêu cầu hoặc đã xử lý vượt quantity đã mua.
4. Đổi size/màu thông thường không bắt buộc ảnh.
5. Sản phẩm lỗi phải có ảnh bằng chứng, trừ khi admin tạo yêu cầu trực tiếp tại cửa hàng sau khi kiểm tra hàng.
6. Chỉ yêu cầu thông tin tài khoản ngân hàng khi thật sự hoàn tiền bằng chuyển khoản thủ công.
7. Nếu PayOS/provider hỗ trợ refund phù hợp, ưu tiên hoàn về phương thức thanh toán gốc.
8. Thời hạn đổi/trả phải được tính từ `deliveredAt` và có cấu hình rõ ràng; nếu chưa có yêu cầu khác, dùng mặc định 14 ngày.
9. Cho phép cấu hình loại trừ theo category/product, ví dụ đồ lót hoặc sản phẩm sale.
10. Khi đổi variant, phải kiểm tra và reserve variant mới trước khi duyệt hoàn tất đổi.
11. Hàng trả chỉ được cộng lại tồn kho sau khi shop đã nhận và kiểm tra hàng có thể bán lại.
12. Sản phẩm lỗi không được tự động nhập lại tồn kho bán được; cần trạng thái kiểm kê như `DAMAGED` hoặc ghi adjustment phù hợp.
13. Mọi bước duyệt, từ chối, nhận hàng, đổi hàng và hoàn tiền phải có audit log.

### State machine gợi ý

```text
REQUESTED
  -> APPROVED hoặc REJECTED
APPROVED
  -> WAITING_FOR_CUSTOMER_SHIPMENT
  -> RETURN_IN_TRANSIT
  -> RECEIVED
  -> INSPECTED
INSPECTED
  -> EXCHANGED
  -> REFUND_PENDING
  -> REJECTED_AFTER_INSPECTION
REFUND_PENDING
  -> REFUNDED
EXCHANGED/REFUNDED
  -> COMPLETED
```

## 10. Phase 6 — Đồng bộ tồn kho online và cửa hàng vật lý

Shop chỉ có một chi nhánh, do đó không xây dựng nhiều warehouse hoặc stock transfer giữa các chi nhánh.

Tuy nhiên, bán tại cửa hàng vật lý và bán online phải dùng chung tồn kho theo variant.

### Quy tắc tồn kho

Áp dụng bất biến:

```text
availableToSell = stockOnHand - stockReserved
```

### Yêu cầu

1. Quy định rõ ý nghĩa `stockOnHand`, `stockReserved` và `availableToSell`.
2. Nếu giữ `stockAvailable`, phải xác định đây là dữ liệu dẫn xuất hoặc bảo đảm luôn đồng bộ; ưu tiên không có hai nguồn sự thật.
3. Không dùng công thức chữa cháy như lấy `max(stockOnHand, stockAvailable + stockReserved)` để che dữ liệu sai.
4. Backfill/migrate dữ liệu tồn hiện tại một cách an toàn.
5. Tất cả thay đổi tồn phải có `InventoryLog` với:
   - action;
   - quantity;
   - beforeQuantity;
   - afterQuantity;
   - referenceType;
   - referenceId;
   - actorId;
   - reason;
   - salesChannel: `ONLINE` hoặc `PHYSICAL_STORE`.
6. Bổ sung nghiệp vụ bán tại cửa hàng vật lý tối giản:
   - admin/nhân viên chọn variant và quantity;
   - hệ thống kiểm tra tồn;
   - tạo giao dịch bán tại quầy hoặc inventory export có reference rõ ràng;
   - trừ tồn trong transaction;
   - ghi nhận phương thức thanh toán tại quầy nếu cần;
   - không bắt buộc xây dựng một POS phức tạp.
7. Checkout online phải reserve tồn có thời hạn.
8. PayOS thất bại/hết hạn và đơn bị hủy phải giải phóng reservation đúng một lần.
9. Thanh toán hoặc bán tại quầy thành công phải trừ tồn đúng một lần.
10. Return chỉ cộng tồn bán được sau khi kiểm tra đạt yêu cầu.
11. Dùng transaction hoặc optimistic locking để chống overselling.

### Test bắt buộc

- Hai người cùng mua variant còn đúng một sản phẩm.
- Bán tại cửa hàng vật lý làm tồn trên website giảm tương ứng.
- Đơn online đang reserve làm số lượng có thể bán tại cửa hàng giảm tương ứng.
- PayOS hết hạn trả lại số lượng có thể bán.
- Webhook lặp không trừ tồn hai lần.
- Sản phẩm lỗi trả về không tự động trở thành hàng bán được.

## 11. Phase 7 — Khách hàng thân thiết ở mức phù hợp shop nhỏ

Xây loyalty ở mức đơn giản, dễ vận hành, không tạo hệ thống quá phức tạp.

### Yêu cầu

1. Dùng ledger giao dịch thay vì chỉ thêm một trường `points` trên User.
2. Các entity tối thiểu:
   - LoyaltyAccount;
   - LoyaltyTransaction;
   - LoyaltyTier, nếu shop muốn dùng hạng;
   - LoyaltyConfig.
3. Hỗ trợ:
   - cộng điểm theo số tiền thực trả;
   - xem số dư và lịch sử điểm;
   - cấu hình tỷ lệ quy đổi;
   - cấu hình thời hạn điểm;
   - ưu đãi hoặc voucher sinh nhật ở mức tùy chọn;
   - tối đa một số lượng hạng nhỏ, ví dụ MEMBER/SILVER/GOLD, nếu thực sự cần.
4. Chỉ cộng điểm khi đơn online hoàn thành hoặc giao dịch tại cửa hàng vật lý hoàn tất.
5. Hủy/hoàn tiền phải thu hồi điểm tương ứng.
6. Giao dịch điểm phải idempotent và có reference tới Order, Return, Refund hoặc giao dịch tại quầy.
7. Không làm loyalty ảnh hưởng đến tính đúng đắn của checkout nếu phase này chưa hoàn thiện.

## 12. Phase 8 — Promotion phù hợp shop nhỏ

Giữ tương thích với voucher hiện tại và mở rộng có chọn lọc.

Ưu tiên hỗ trợ:

- giảm phần trăm;
- giảm số tiền cố định;
- đơn tối thiểu;
- mức giảm tối đa;
- giới hạn tổng lượt và lượt mỗi khách;
- áp dụng theo product/category;
- voucher theo nhóm thành viên;
- combo đơn giản;
- mua X tặng Y nếu kiến trúc cho phép.

Yêu cầu:

1. Backend trả discount breakdown rõ ràng.
2. Voucher phải được kiểm tra lại khi tạo Order và khi xác nhận thanh toán nếu nghiệp vụ yêu cầu.
3. Voucher usage chỉ được ghi nhận đúng một lần.
4. Quy định rõ voucher có được cộng dồn với promotion khác hay không.
5. Không cần xây promotion engine cấp marketplace hoặc chiến dịch quá phức tạp.

## 13. Phase 9 — Gợi ý size có cấu trúc

Dự án đã có size guide image, tuổi, chiều cao, cân nặng, recommendation và virtual try-on. Hãy bổ sung gợi ý size thực tế nhưng không phóng đại độ chính xác.

### Yêu cầu

1. Size chart phải có dữ liệu có cấu trúc, không chỉ là ảnh.
2. Cho phép cấu hình theo product type hoặc từng sản phẩm.
3. Có thể dùng:
   - chiều cao;
   - cân nặng;
   - số đo cơ thể nếu có;
   - fit preference: ôm, vừa hoặc rộng.
4. API trả size đề xuất, mức tin cậy và lý do.
5. Luôn cho phép khách tự chọn size khác.
6. Cảnh báo khi hồ sơ nằm giữa hai size.
7. Dùng từ `đề xuất`, không khẳng định size chắc chắn vừa.
8. Viết test cho các giá trị biên giữa hai size.

## 14. Phase 10 — Quản trị cửa hàng một chi nhánh

Trang quản trị cần phục vụ đúng hoạt động của shop nhỏ:

1. Quản lý sản phẩm, variant, ảnh, category, tag và size chart.
2. Quản lý tồn kho dùng chung giữa online và cửa hàng vật lý.
3. Ghi nhận nhập hàng, điều chỉnh kho và bán tại quầy.
4. Quản lý đơn online, đóng gói, giao hàng và mã vận đơn.
5. Quản lý đổi hàng, trả hàng và hoàn tiền.
6. Quản lý voucher và loyalty.
7. Dashboard tối thiểu:
   - doanh thu online;
   - doanh thu tại cửa hàng vật lý;
   - tổng doanh thu;
   - số đơn/giao dịch;
   - sản phẩm bán chạy;
   - tồn thấp;
   - đơn đang xử lý;
   - yêu cầu đổi/trả đang chờ;
   - số tiền hoàn.
8. Nếu schema chưa lưu giá vốn, không được trình bày doanh thu là lợi nhuận.
9. Phân quyền tối thiểu có thể gồm `ADMIN` và `STAFF`; không cần role `SELLER` theo nghĩa marketplace.

## 15. Phase 11 — Chất lượng và kiểm thử

1. Sửa lỗi lint liên quan đến source được thay đổi, đặc biệt:
   - `no-explicit-any`;
   - cập nhật state đồng bộ trong effect;
   - dependency của React Hook.
2. Bổ sung unit, integration và E2E cho các luồng cốt lõi.
3. E2E tối thiểu:
   - đăng ký/đăng nhập;
   - chọn variant và thêm giỏ;
   - áp voucher;
   - checkout PayOS với freeship;
   - checkout COD với freeship;
   - PayOS webhook;
   - admin xác nhận, đóng gói và giao đơn;
   - khách xem tracking và xác nhận nhận hàng;
   - đổi size/màu;
   - trả một phần đơn vì lỗi và hoàn đủ tiền sản phẩm lỗi;
   - hủy đơn đã thanh toán;
   - bán tại cửa hàng vật lý và đồng bộ tồn online;
   - loyalty cộng và thu hồi điểm, nếu phase loyalty được triển khai.
4. Chạy đầy đủ:
   - backend test;
   - client khách hàng lint và build;
   - client admin lint và build;
   - Prisma validate/generate/migration check.
5. Phân biệt rõ lỗi có sẵn với lỗi phát sinh do thay đổi.

## 16. Tiêu chí bảo mật và toàn vẹn dữ liệu

1. Tất cả API order, payment, return, refund và address phải kiểm tra ownership hoặc quyền admin/staff.
2. Không cho client tự đặt `userId`, `paymentStatus`, `orderStatus`, `discountAmount`, `shippingFee` hoặc `grandTotal`.
3. PayOS webhook phải được xác thực theo SDK/chữ ký chính thức.
4. Các thao tác có thể gọi lại phải có idempotency key hoặc unique constraint thích hợp.
5. Không trả password hash, token, thông tin ngân hàng đầy đủ hoặc dữ liệu nhạy cảm trong API không cần thiết.
6. Audit log cần đủ để truy vết nhưng không chứa dữ liệu nhạy cảm dư thừa.
7. Kiểm tra dữ liệu đầu vào, giới hạn độ dài và số lượng ảnh upload.

## 17. Đầu ra bắt buộc sau mỗi phase

Sau mỗi phase, hãy báo cáo:

1. Nghiệp vụ đã triển khai.
2. Danh sách file đã tạo hoặc chỉnh sửa.
3. Prisma migration và cách backfill.
4. API mới hoặc API thay đổi.
5. State transition và business rule quan trọng.
6. Test đã viết và kết quả thực tế.
7. Kết quả lint/build.
8. Giả định đã sử dụng.
9. Rủi ro hoặc công việc còn lại.
10. Hướng dẫn kiểm thử thủ công.

Không tuyên bố hoàn thành nếu chưa chạy kiểm tra hoặc chưa có bằng chứng.

## 18. Thứ tự ưu tiên triển khai

Triển khai theo thứ tự sau:

1. Snapshot địa chỉ giao hàng trên Order.
2. Freeship cố định và shipping breakdown bằng 0.
3. PayOS lifecycle và COD.
4. State machine đơn hàng.
5. Đổi size/màu và trả hàng–hoàn tiền; sản phẩm lỗi hoàn toàn tiền, không bảo hành.
6. Chuẩn hóa tồn kho dùng chung cho online và cửa hàng vật lý một chi nhánh.
7. Ghi nhận bán tại cửa hàng vật lý ở mức tối giản.
8. Loyalty đơn giản.
9. Promotion mở rộng có chọn lọc.
10. Gợi ý size.
11. E2E, lint, build và hardening.

Hãy bắt đầu bằng Phase 0. Sau khi khảo sát, trình bày kế hoạch Phase 1 và xác định chính xác model, migration, API, service, test và màn hình sẽ thay đổi. Sau đó trực tiếp triển khai Phase 1, chạy kiểm tra và báo cáo kết quả trước khi chuyển sang phase tiếp theo.
````
