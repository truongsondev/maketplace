# Prompt triển khai các nghiệp vụ còn thiếu cho shop thời trang một chi nhánh

Bạn là senior full-stack engineer và business analyst. Hãy kiểm tra và trực tiếp hoàn thiện source hiện tại của một shop thời trang nhỏ có đúng một cửa hàng vật lý và một website bán hàng.

## 1. Bối cảnh nghiệp vụ bất biến

- Đây là single-store commerce, không phải marketplace và không có nhiều chi nhánh.
- Tồn kho online và tại cửa hàng vật lý dùng chung theo từng variant.
- Toàn bộ đơn online được miễn phí giao hàng; backend luôn xác định `shippingFee = 0`.
- Phương thức thanh toán online là PayOS; ngoài ra có COD.
- Shop không có bảo hành. Sản phẩm lỗi đi theo luồng trả hàng và hoàn tiền.
- Không xây kiến trúc seller, commission, multi-warehouse, shipping zone hoặc promotion engine cấp marketplace.
- Không tin giá, discount, tổng tiền, trạng thái thanh toán, trạng thái đơn hoặc userId do client gửi lên.

## 2. Trạng thái source đã được xác minh

Không được giả định mọi tính năng dưới đây đều chưa tồn tại. Trước khi sửa, phải đọc schema, migration, API, service, test và UI hiện tại, sau đó tái sử dụng phần đúng:

1. `OrderItem.price` đã lưu đơn giá tại thời điểm checkout, nhưng chưa snapshot đầy đủ tên sản phẩm, SKU, tên/thuộc tính variant, ảnh và breakdown giá.
2. Snapshot địa chỉ giao hàng, `shippingFee = 0`, PayOS và COD cơ bản đã có.
3. Backend hiện cho phép xác nhận COD ở trạng thái payment `PENDING`; COD được thu tiền khi giao thành công. Cần kiểm tra UI admin và sửa lỗi thực tế thay vì viết lại toàn bộ.
4. Backend đã có `PhysicalSale`, `PhysicalSaleItem` và API `/api/admin/physical-sales`, nhưng chưa có màn hình bán tại quầy đầy đủ.
5. Loyalty đã có `LoyaltyAccount`, `LoyaltyTransaction`, `LoyaltyConfig`, API xem điểm và logic cộng điểm khi giao hàng. Chưa hoàn thiện vận hành, cấu hình, thu hồi điểm và tích điểm cho giao dịch tại quầy.
6. Voucher hiện áp dụng trên subtotal toàn giỏ; chưa có phạm vi product/category/member.
7. Chưa có Promotion độc lập cho shop nhỏ.
8. Return backend đã nhận item/quantity và request type, nhưng UI đổi size/màu và state machine kiểm định hàng trả chưa hoàn chỉnh.
9. Size recommendation có backend rule tối thiểu nhưng thiếu UI khách hàng và CRUD admin.

Nếu source thực tế khác mô tả trên, hãy đưa bằng chứng file/dòng và ưu tiên source hiện tại. Không xóa hoặc viết lại tính năng đang đúng chỉ để đổi kiến trúc.

## 3. Phase 0 — Audit bắt buộc

Trước khi triển khai:

1. Lập bảng `Đã hoàn chỉnh / Có một phần / Chưa có / Có lỗi` cho:
   - order pricing snapshot;
   - PayOS và COD lifecycle;
   - order state machine;
   - physical-store sale;
   - inventory reservation;
   - voucher targeting;
   - promotion;
   - loyalty;
   - exchange/return/refund;
   - size recommendation;
   - dashboard/audit/security.
2. Truy vết đầy đủ từ UI → API → use case/service → repository → Prisma cho từng mục.
3. Kiểm tra migration đã tạo có thực sự được áp dụng và tương thích dữ liệu cũ hay chưa.
4. Chỉ ra race condition, idempotency gap, ownership gap, dữ liệu client có thể giả mạo và các API có backend nhưng chưa có UI.
5. Trình bày kế hoạch file/model/API/test sẽ thay đổi rồi trực tiếp triển khai theo thứ tự dưới đây.

## 4. Phase 1 — Snapshot đầy đủ sản phẩm và giá tại thời điểm mua

Mục tiêu: đơn hàng cũ không thay đổi nội dung hiển thị khi admin đổi tên sản phẩm, giá, SKU, ảnh hoặc thuộc tính variant.

### Yêu cầu dữ liệu

Mở rộng `OrderItem` hoặc tạo `OrderItemSnapshot` bất biến, tối thiểu gồm:

- `productName`;
- `productSlug`, nullable nếu không cần điều hướng;
- `sku`;
- `variantName` hoặc `variantAttributes` dạng JSON;
- `imageUrl`, nullable;
- `originalUnitPrice`;
- `sellingUnitPrice`;
- `lineSubtotal` trước giảm giá;
- `lineDiscountAmount`;
- `lineTotal` sau giảm giá;
- `quantity`;
- ID product/variant chỉ để truy vết, không dùng làm nguồn hiển thị lịch sử.

`Order` phải có pricing snapshot rõ ràng:

```text
itemsSubtotal
- productDiscount
- voucherDiscount
+ shippingFee (luôn 0)
= grandTotal
```

### Quy tắc

1. Backend lấy toàn bộ tên, SKU, thuộc tính và giá từ database trong transaction checkout.
2. PayOS và COD phải dùng chung một pricing/snapshot service để không lệch tiền.
3. Không lấy lại tên/giá hiện tại từ `Product` hoặc `ProductVariant` khi đọc đơn cũ.
4. API khách, admin, hóa đơn, return/refund đều đọc snapshot.
5. Backfill đơn cũ phải đánh dấu `LEGACY_BACKFILL`; không giả vờ dữ liệu khôi phục là snapshot chính xác.
6. Tiền dùng Decimal hoặc integer minor unit nhất quán; không dùng floating point cho phép tính nghiệp vụ.

### Test bắt buộc

- Đặt đơn khi sản phẩm tên A, giá 100.000; sau đó đổi thành tên B, giá 150.000; đơn cũ vẫn hiện A và 100.000.
- PayOS và COD tạo cùng cart phải có cùng pricing snapshot.
- Client gửi giá giả không làm thay đổi tiền trên Order.
- Return một phần tính refund từ snapshot, không từ giá hiện tại.

## 5. Phase 2 — Hoàn thiện COD và thao tác admin

Không viết lại COD nếu backend hiện tại đã đúng. Hãy tái hiện lỗi “admin không xác nhận được đơn giao hàng rồi mới thanh toán” trên UI/API và sửa tận gốc.

### State mong muốn

```text
COD:
Order PENDING + Payment PENDING
-> admin CONFIRMED
-> PACKING
-> SHIPPED
-> DELIVERED
-> Payment PAID (thu COD thành công)
-> COMPLETED
```

Nếu giao thất bại:

```text
SHIPPED -> DELIVERY_FAILED -> SHIPPED hoặc RETURN_TO_STORE/CANCELLED
```

### Yêu cầu

1. Admin thấy rõ badge `COD - Chưa thu tiền` và có thể xác nhận đơn khi tồn đã reserve hợp lệ.
2. Không áp điều kiện “payment phải PAID” của PayOS cho COD.
3. Chỉ chuyển COD payment sang `PAID` khi admin xác nhận giao và thu tiền thành công.
4. Nếu giao thất bại/khách từ chối nhận, không đánh dấu paid; reservation/tồn chỉ được release hoặc phục hồi đúng một lần khi hàng về shop.
5. Bổ sung `PACKING`, `DELIVERY_FAILED`, `RETURN_TO_STORE`, `COMPLETED` nếu phù hợp với schema; migration phải an toàn.
6. Mọi transition có history, actor, timestamp, reason và audit log.
7. Endpoint lặp phải idempotent; không thu COD hoặc trừ tồn hai lần.

### Test bắt buộc

- Admin xác nhận được COD `PENDING`.
- Admin không xác nhận được PayOS chưa paid.
- COD delivered chuyển payment paid đúng một lần.
- COD giao thất bại không chuyển paid.
- Hàng COD hoàn về shop phục hồi tồn đúng một lần.

## 6. Phase 3 — Bán hàng tại cửa hàng vật lý

Hoàn thiện phần backend tối thiểu đang có thành một chức năng admin/staff sử dụng được; không xây POS phức tạp.

### UI admin tối thiểu

- Route và menu `Bán tại cửa hàng`.
- Tìm sản phẩm theo tên/SKU hoặc quét/nhập SKU.
- Chọn variant, quantity; thấy tồn có thể bán theo thời gian hiện tại.
- Giỏ hàng tại quầy: sửa số lượng, xóa dòng, tổng tiền.
- Phương thức: CASH, BANK_TRANSFER, CARD.
- Xác nhận thanh toán và in/xem hóa đơn đơn giản.
- Danh sách và chi tiết giao dịch tại quầy; quyền ADMIN/STAFF.

### Backend và tồn kho

1. Backend tự đọc giá variant và tính tổng, không tin giá client.
2. Dùng transaction và optimistic locking/conditional update chống bán vượt tồn.
3. Tồn khả dụng phải trừ cả reservation online.
4. Giao dịch tại quầy trừ tồn và ghi `InventoryLog` với `PHYSICAL_STORE` đúng một lần.
5. Bổ sung mã giao dịch, trạng thái, `paidAt`, thông tin cashier và snapshot item tương tự OrderItem.
6. Hỗ trợ hủy/hoàn giao dịch tại quầy bằng nghiệp vụ đảo, không xóa record lịch sử.
7. Tích loyalty cho khách có tài khoản/số điện thoại nếu được gắn vào giao dịch; khách vãng lai là nullable.

### Test bắt buộc

- Hai cashier cùng bán variant còn một sản phẩm: chỉ một giao dịch thành công.
- Reservation online làm giảm số lượng bán được tại quầy.
- Bán tại quầy làm tồn website giảm ngay.
- Gửi lại request không tạo hai giao dịch.
- Hủy giao dịch phục hồi tồn đúng một lần và ghi audit.

## 7. Phase 4 — Voucher có phạm vi áp dụng

Giữ voucher hiện tại và mở rộng phạm vi, không biến voucher thành promotion.

### Phạm vi hỗ trợ

- `ALL_PRODUCTS`;
- `INCLUDE_CATEGORIES`;
- `INCLUDE_PRODUCTS`;
- tùy chọn `EXCLUDE_CATEGORIES` và `EXCLUDE_PRODUCTS`;
- `MEMBER_TIERS`, nếu loyalty tier được sử dụng.

### Quy tắc

1. Dùng bảng quan hệ, không lưu danh sách ID dạng chuỗi.
2. Với category cha, định nghĩa rõ có bao gồm category con hay không; ưu tiên cờ cấu hình `includeDescendants`.
3. `minOrderAmount` phải tính trên eligible subtotal hay toàn giỏ theo một rule được lưu rõ; mặc định dùng eligible subtotal.
4. Discount chỉ tính trên các item đủ điều kiện.
5. Fixed discount không vượt eligible subtotal; percentage vẫn áp max discount.
6. Checkout trả breakdown theo dòng: item nào eligible và được phân bổ bao nhiêu discount.
7. Validate lại voucher trong transaction tạo Order và khi xác nhận payment nếu cần.
8. Usage/quota/user limit phải idempotent và chống race condition.
9. Admin UI cho phép chọn/search category, product và member tier; màn chi tiết hiển thị phạm vi dễ hiểu.

### Test bắt buộc

- Voucher category không giảm sản phẩm ngoài category.
- Giỏ hỗn hợp chỉ giảm eligible subtotal.
- Include/exclude xung đột phải có rule xác định, ưu tiên exclude.
- Category con được xử lý đúng theo `includeDescendants`.
- Quota cuối cùng không bị dùng bởi hai checkout cùng lúc.

## 8. Phase 5 — Loyalty hoàn chỉnh nhưng đơn giản

Tái sử dụng ledger hiện có. Không chỉ thêm trường points vào User.

### Yêu cầu

1. Admin CRUD `LoyaltyConfig`: số tiền cho một điểm, ngày hết hạn, bật/tắt.
2. Khách xem balance, tier và lịch sử earn/redeem/reverse/expire với mô tả dễ hiểu.
3. Cộng điểm khi đơn online `COMPLETED` hoặc physical sale hoàn tất, không cộng sớm khi chỉ `DELIVERED` nếu còn cửa sổ hoàn trả.
4. Return/refund/cancel phải thu hồi điểm theo phần tiền thực hoàn; idempotent theo reference.
5. Job hoặc lazy processor xử lý điểm hết hạn, không cho balance âm do lỗi cạnh tranh.
6. Cho phép admin điều chỉnh điểm có reason và audit log.
7. Nếu triển khai đổi điểm/voucher, phải có ledger `REDEEM` và quy tắc hoàn điểm khi checkout thất bại.
8. Tier chỉ nên gồm MEMBER/SILVER/GOLD và có rule cấu hình rõ; nếu chưa dùng quyền lợi tier, không giả lập ưu đãi.
9. Loyalty lỗi không được làm thất bại settlement thanh toán cốt lõi; cần outbox/retry hoặc cơ chế hậu xử lý an toàn.

### Test bắt buộc

- Hoàn tất đơn cộng điểm một lần.
- Webhook/transition lặp không cộng lần hai.
- Refund một phần thu hồi đúng tỷ lệ điểm.
- Refund toàn bộ thu hồi toàn bộ điểm đã kiếm từ đơn.
- Physical sale có user được cộng điểm; khách vãng lai không tạo account giả.
- Hết hạn điểm cập nhật ledger và balance đúng một lần.

## 9. Phase 6 — Promotion phù hợp shop nhỏ

Promotion là giảm giá tự động; voucher là mã khách nhập. Tách hai khái niệm nhưng dùng chung pricing engine/breakdown để tránh tính tiền hai lần.

### Loại promotion ưu tiên

1. Giảm phần trăm hoặc số tiền tự động theo product/category.
2. Giá sale theo khoảng thời gian.
3. Combo cố định, ví dụ mua áo + quần giảm 100.000.
4. `BUY_X_GET_Y` đơn giản nếu kiến trúc hiện tại cho phép triển khai an toàn.

### Model và rule

- Promotion: name, type, status DRAFT/ACTIVE/PAUSED/EXPIRED, priority, start/end, usage limit.
- PromotionCondition và PromotionBenefit hoặc model tương đương có kiểu dữ liệu rõ.
- Scope product/category bằng bảng quan hệ.
- Rule stacking: mặc định một promotion tốt nhất trên mỗi item; voucher có được cộng thêm hay không phải do `stackableWithVoucher` quy định.
- Không cho tổng discount vượt giá trị eligible item/order.
- Backend quyết định promotion đang active dựa trên thời gian server.
- Lưu promotion snapshot và discount allocation trên Order/OrderItem để lịch sử không đổi.

### Admin và storefront

- Admin CRUD, preview promotion, bật/tắt và xem trạng thái/lượt sử dụng.
- Trang sản phẩm/giỏ/checkout hiển thị giá gốc, giá sau promotion, tên ưu đãi và breakdown.
- Không hiển thị promotion đã hết hạn; cache phải có chiến lược invalidation.

### Test bắt buộc

- Promotion bắt đầu/kết thúc đúng thời gian.
- Hai promotion cùng áp dụng chọn đúng theo priority/best price rule.
- Promotion và voucher tuân thủ stacking rule.
- Combo/BXGY không tặng hoặc giảm sai quantity.
- Giá promotion được snapshot trên đơn cũ.

## 10. Phase 7 — Các khoảng trống liên quan cần hoàn thiện

### Exchange, return và refund

- Hoàn thiện UI chọn variant đổi size/màu.
- Reserve variant mới trước khi duyệt exchange; release đúng một lần nếu hủy.
- Có bước `RECEIVED`, `INSPECTED`, kết luận `RESTOCKABLE` hoặc `DAMAGED`.
- Chỉ hàng đạt kiểm định mới cộng tồn bán được; hàng lỗi không tự động restock.
- Refund một phần dùng pricing snapshot và allocation discount.
- Thu hồi loyalty tương ứng và audit mọi bước.

### Inventory reservation

- Reservation có `expiresAt`, trạng thái và reference rõ ràng.
- Worker giải phóng PayOS order hết hạn đúng một lần.
- Không dùng `max(stockOnHand, stockAvailable + stockReserved)` để che invariant sai.
- Có reconciliation report phát hiện lệch tồn nhưng không tự sửa âm thầm.

### Size recommendation

- Admin CRUD size rule theo product type/product.
- Trang sản phẩm có form chiều cao/cân nặng/fit preference, hiển thị đề xuất và cảnh báo biên.
- Khách luôn được chọn size khác.

### Dashboard và audit

- Dashboard tách online/physical-store revenue theo cùng time range.
- Thêm đơn đang xử lý, return chờ, refund, low stock, best seller và promotion/voucher performance.
- Không gọi doanh thu là lợi nhuận khi chưa có cost price.
- Audit log không chứa đầy đủ thông tin ngân hàng hoặc dữ liệu nhạy cảm.

### Phân quyền và bảo mật

- Xác minh ADMIN/STAFF cho API tại quầy, voucher, promotion, loyalty config và inventory.
- Ownership bắt buộc cho order/payment/return/refund/loyalty của khách.
- Validation giới hạn quantity, độ dài text, file upload và enum.
- Idempotency key/unique constraint cho checkout, webhook, COD settlement, physical sale, refund, inventory và loyalty.

## 11. Migration và tương thích dữ liệu

1. Mỗi phase có migration độc lập, tên rõ ràng và rollback strategy mô tả trong báo cáo.
2. Không sửa migration đã áp dụng; tạo migration mới.
3. Backfill dữ liệu legacy theo batch nếu bảng lớn.
4. Field snapshot legacy không khôi phục chắc chắn phải có source/quality marker.
5. Thêm index/unique constraint phục vụ idempotency và truy vấn chính.
6. Chạy `prisma validate`, `prisma generate` và migration status/check; không tự chạy migration production khi chưa được cấp quyền.

## 12. Chất lượng và kiểm thử

Sau mỗi phase phải chạy và báo cáo kết quả thực tế:

- backend TypeScript;
- backend unit/integration tests;
- client khách lint và build;
- client admin lint và build;
- Prisma validate/generate/migration check;
- `git diff --check`.

Bổ sung E2E cho:

1. PayOS và COD checkout với snapshot giá/sản phẩm.
2. Admin xác nhận COD chưa thanh toán, giao hàng và thu tiền.
3. Bán tại quầy đồng bộ tồn online.
4. Voucher category trên giỏ hỗn hợp.
5. Promotion tự động và stacking với voucher.
6. Loyalty earn/reverse/expire.
7. Exchange variant và trả hàng lỗi một phần.

Không sửa lỗi bằng cách bỏ test, tắt lint rule, dùng `any`, hard-code dữ liệu hoặc bỏ qua transaction.

## 13. Đầu ra bắt buộc sau mỗi phase

Sau mỗi phase, báo cáo:

1. Nghiệp vụ đã triển khai.
2. File tạo/sửa.
3. Schema và migration/backfill.
4. API mới/thay đổi kèm request/response mẫu.
5. State transition và authorization.
6. Test đã thêm và kết quả thực tế.
7. Kết quả lint/build.
8. Rủi ro và phần còn lại.
9. Các bước kiểm thử thủ công.

Không tuyên bố hoàn thành một tính năng nếu mới có model/API nhưng chưa có UI cần thiết, chưa nối route, chưa có authorization, chưa có migration hoặc chưa chạy kiểm tra.

## 14. Thứ tự triển khai

1. Audit và tái hiện lỗi COD admin.
2. Snapshot sản phẩm và pricing đầy đủ.
3. Sửa/hoàn thiện COD lifecycle và admin UI.
4. Hoàn thiện bán tại cửa hàng vật lý.
5. Voucher targeting.
6. Loyalty hoàn chỉnh.
7. Promotion tự động.
8. Exchange/return, reservation expiry, size UI và dashboard.
9. E2E, hardening và báo cáo cuối.

Hãy bắt đầu bằng Phase 0, trình bày bằng chứng từ source và kế hoạch ngắn gọn. Sau đó trực tiếp triển khai Phase 1; không dừng lại chỉ để đề xuất kiến trúc.
