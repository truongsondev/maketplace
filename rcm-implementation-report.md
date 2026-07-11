# Báo cáo triển khai nghiệp vụ shop thời trang một chi nhánh

Ngày kiểm chứng: 10/07/2026.

## Phạm vi và giả định

- Một shop, một cửa hàng vật lý, một nguồn tồn kho theo variant.
- Mọi đơn online miễn phí giao hàng; backend cố định `shippingFee = 0`.
- Hỗ trợ PayOS và COD.
- Không có bảo hành. Hàng lỗi đi qua `RETURN_REFUND` và không tự động nhập lại tồn bán được.
- Thời hạn đổi/trả mặc định là 14 ngày tính từ `deliveredAt`.

## Kết quả theo phase

### Phase 0 — Khảo sát

Đã rà các module auth/user/address, catalog/variant, cart, voucher, payment, order, return/refund, inventory, dashboard, recommendation và virtual try-on. Các rủi ro chính được xử lý trong lần triển khai này gồm địa chỉ đơn phụ thuộc hồ sơ hiện tại, tồn kho có nhiều cách diễn giải, COD chưa có settlement, return mặc định theo toàn đơn và thiếu phân tách doanh thu theo kênh.

### Phase 1 — Snapshot địa chỉ đơn hàng

- Thêm quan hệ 1-1 `OrderShippingAddress` và tạo snapshot trong cùng transaction tạo Order.
- API khách hàng và admin đọc snapshot, không đọc địa chỉ mới nhất trong hồ sơ.
- Migration `20260710143000_add_order_shipping_snapshot` backfill dữ liệu có thể khôi phục với nhãn `LEGACY_PROFILE_BACKFILL`; đơn không thể khôi phục được đánh dấu `LEGACY_MISSING_SNAPSHOT`.
- Test chứng minh sửa địa chỉ hồ sơ từ A sang B không làm thay đổi địa chỉ A trên đơn cũ.

### Phase 2 — Miễn phí giao hàng

- Thêm `subtotalPrice`, `shippingFee`, `carrierName`, `trackingCode`, `deliveryNote`, `shippedAt`, `deliveredAt`.
- Backend không nhận phí ship từ client và luôn lưu `shippingFee = 0`.
- Checkout và chi tiết đơn hiển thị breakdown, đơn vị vận chuyển và mã vận đơn.
- Admin nhập thông tin vận chuyển khi chuyển sang `SHIPPED`.
- Migration: `20260710150000_add_free_shipping_delivery_fields`.

### Phase 3 và 4 — PayOS, COD và vòng đời đơn

- Bổ sung `POST /api/payments/cod/orders`; COD không tạo PayOS transaction.
- COD khởi tạo payment `PENDING`, reserve tồn; khi giao thành công mới chuyển `PAID` và consume reservation đúng một lần.
- Chặn admin xác nhận đơn PayOS chưa thanh toán; cho phép xác nhận COD hợp lệ.
- Transition admin được kiểm tra, ghi lịch sử trạng thái và audit log; `shippedAt`/`deliveredAt` được ghi tại transition tương ứng.
- PayOS webhook hiện có tiếp tục là nguồn đáng tin cậy để đánh dấu thanh toán và có tính idempotent.
- Test mới cho tạo COD và COD settlement idempotent.

### Phase 5 — Trả hàng theo dòng sản phẩm

- Thêm `ReturnRequestType`: `EXCHANGE` và `RETURN_REFUND`.
- Request nhận danh sách `{ orderItemId, quantity, requestedVariantId? }`, không còn mặc định trả toàn đơn.
- Kiểm tra ownership, số lượng mua, số lượng đã/đang yêu cầu, variant đổi cùng sản phẩm và còn hàng.
- Chỉ bắt buộc ảnh cho lý do `DEFECTIVE`; thông tin ngân hàng chỉ bắt buộc với hoàn tiền thủ công.
- Số tiền hoàn một phần được tính theo giá trị dòng được duyệt và phân bổ giảm giá của đơn, không hoàn nhầm toàn đơn.
- Migration: `20260710160000_add_partial_return_fields`.

Giới hạn còn lại: backend đã nhận yêu cầu đổi variant nhưng giao diện khách chưa có bộ chọn variant đổi hoàn chỉnh; state machine return vẫn đang dùng các trạng thái coarse-grained hiện hữu, chưa tách đủ từng bước vận chuyển/kiểm định như prompt gợi ý.

### Phase 6 — Tồn kho dùng chung

- Chuẩn hóa invariant `stockAvailable = stockOnHand - stockReserved` và bỏ logic `max(...)` trong luồng checkout/settlement chính.
- Reserve, release và sale dùng transaction/optimistic update; mọi log mới có before/after, reference, actor/reason và sales channel.
- Điều chỉnh kho thủ công giữ nguyên reservation và không cho giảm on-hand thấp hơn reserved.
- Migration `20260710170000_normalize_inventory_invariant` backfill on-hand từ available + reserved và mở rộng `InventoryLog`.

### Phase 7 — Loyalty đơn giản

- Thêm `LoyaltyAccount`, ledger `LoyaltyTransaction` và `LoyaltyConfig`.
- Cộng điểm theo số tiền thực trả khi giao thành công; unique idempotency key ngăn cộng lặp.
- Thêm `GET /api/users/me/loyalty` và hiển thị số dư/lịch sử tại hồ sơ khách hàng.
- Migration: `20260710180000_add_simple_loyalty`.

Giới hạn còn lại: chưa có processor hết hạn điểm, UI cấu hình admin và bút toán thu hồi điểm theo số tiền refund.

### Phase 8 — Promotion

Voucher hiện tại tiếp tục hỗ trợ phần trăm/số tiền, đơn tối thiểu, giảm tối đa, quota tổng/quota khách và ghi usage idempotent. Chưa triển khai targeting theo product/category/member, combo hoặc mua X tặng Y trong lần này.

### Phase 9 — Gợi ý size có cấu trúc

- Thêm `SizeChartRule` theo product hoặc product type, khoảng chiều cao/cân nặng, fit preference và priority.
- Thêm `POST /api/products/:id/size-recommendation`, trả size đề xuất, confidence, alternatives, lý do và cảnh báo biên.
- Migration: `20260710190000_add_structured_size_chart`.
- Có unit test cho trường hợp nằm giữa hai size.

Giới hạn còn lại: chưa có màn hình admin CRUD rule và widget chọn size mới trên trang sản phẩm.

### Phase 10 — Bán tại cửa hàng vật lý

- Thêm `PhysicalSale`, `PhysicalSaleItem` và `SalesChannel.PHYSICAL_STORE`.
- Thêm `POST /api/admin/physical-sales` và `GET /api/admin/physical-sales`.
- Giá được lấy ở backend; giao dịch trừ tồn chung theo variant trong transaction và ghi inventory log.
- Dashboard API tách doanh thu online/cửa hàng vật lý và tổng hợp tổng doanh thu.
- Migration: `20260710200000_add_physical_sales`.

Giới hạn còn lại: chưa có màn hình thu ngân/POS tối giản trên frontend admin; dashboard timeseries hiện vẫn là kênh online.

### Phase 11 — Kiểm chứng

- `npx prisma validate`: đạt.
- `npx tsc --noEmit` tại backend: đạt.
- Backend: 25 test suites, 62 tests đều đạt.
- Client khách: lint 0 lỗi (3 cảnh báo tối ưu cũ), production build đạt.
- Client admin: lint 0 lỗi (13 cảnh báo hook cũ), production build đạt.
- `git diff --check`: không có lỗi whitespace; chỉ có cảnh báo LF/CRLF của môi trường Windows.

Chưa có test E2E trình duyệt vì repository chưa có hạ tầng E2E được cấu hình. Các test mới tập trung vào snapshot địa chỉ, ownership, COD settlement, loyalty idempotency và gợi ý size biên.

## Kiểm thử thủ công đề xuất

1. Chạy migration trên database staging và tạo lại Prisma Client.
2. Đặt một đơn PayOS và một đơn COD bằng địa chỉ A; sửa hồ sơ thành B rồi kiểm tra cả màn khách/admin vẫn hiện A.
3. Với COD, chuyển lần lượt sang confirmed, shipped, delivered; xác nhận payment chỉ chuyển paid và tồn chỉ bị consume một lần.
4. Tạo return một phần cho một dòng lỗi, kiểm tra bắt buộc ảnh và số tiền hoàn chỉ thuộc dòng được duyệt.
5. Gọi API bán tại quầy, kiểm tra `stockOnHand`, `stockAvailable` và tồn hiển thị trên website cùng giảm.
6. Gọi lại webhook/settlement với cùng reference để kiểm tra không trừ tồn, ghi voucher hoặc cộng điểm lần hai.

## Việc nên làm tiếp

Ưu tiên tiếp theo là hoàn thiện UI đổi variant và bán tại quầy, thu hồi loyalty khi refund, promotion targeting, state machine return chi tiết và bổ sung Playwright/Cypress E2E. Không nên bật production trước khi chạy toàn bộ migration và smoke test trên bản sao dữ liệu thực tế.
