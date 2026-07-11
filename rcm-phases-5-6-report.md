# Báo cáo triển khai Phase 5-6

Ngày thực hiện: 2026-07-11

## Phase 5 - Loyalty hoàn chỉnh nhưng đơn giản

### Đã triển khai

- Tái sử dụng ledger `LoyaltyAccount`, `LoyaltyTransaction`, `LoyaltyConfig`.
- Cấu hình admin cho loyalty:
  - số tiền cho 1 điểm;
  - ngày hết hạn điểm;
  - bật/tắt loyalty;
  - ngưỡng tier `MEMBER/SILVER/GOLD`.
- Chuyển cộng điểm online từ `DELIVERED` sang `COMPLETED`.
- Cộng điểm cho physical sale nếu giao dịch có `customerId`; khách vãng lai không tạo account giả.
- Reverse điểm khi:
  - hủy/hoàn giao dịch tại quầy;
  - hoàn tiền hủy đơn online;
  - hoàn trả hàng online theo tỷ lệ `OrderItem.lineTotal * returnedQuantity / quantity`.
- Thêm xử lý expire điểm idempotent theo ledger.
- Admin có API điều chỉnh điểm thủ công với reason và audit log.
- Customer API `/api/users/me/loyalty` tiếp tục trả balance, tier, history và bổ sung config hiển thị.

### API admin mới

- `GET /api/admin/loyalty/config`
- `PUT /api/admin/loyalty/config`
- `GET /api/admin/loyalty/accounts`
- `GET /api/admin/loyalty/accounts/:userId`
- `POST /api/admin/loyalty/accounts/:userId/adjust`
- `POST /api/admin/loyalty/expire`

### UI admin

- Route `/loyalty`.
- Menu `Loyalty`.
- Form cấu hình loyalty.
- Điều chỉnh điểm thủ công có reason.
- Nút xử lý điểm hết hạn.

## Phase 6 - Promotion tự động cho shop nhỏ

### Đã triển khai

- Tách promotion tự động khỏi voucher.
- Thêm model:
  - `Promotion`;
  - `PromotionIncludedProduct`;
  - `PromotionIncludedCategory`;
  - `PromotionUsage`.
- Hỗ trợ promotion:
  - `PERCENTAGE`;
  - `FIXED_AMOUNT`;
  - `SALE_PRICE`;
  - enum đã chuẩn bị `COMBO_FIXED`, `BUY_X_GET_Y` nhưng UI/service hiện ưu tiên 3 loại an toàn trước.
- Scope:
  - toàn bộ sản phẩm;
  - product được chọn;
  - category được chọn;
  - tùy chọn include descendants.
- Rule:
  - backend quyết định promotion active theo giờ server;
  - mỗi item chọn promotion tốt nhất;
  - không giảm vượt line subtotal;
  - `stackableWithVoucher=false` thì voucher không áp thêm trên line đó;
  - promotion discount được snapshot vào `OrderItem`;
  - usage promotion được ghi idempotent khi PayOS/COD thật sự paid.
- Order snapshot mới:
  - `Order.promotionDiscount`;
  - `OrderItem.promotionDiscountAmount`;
  - `OrderItem.voucherDiscountAmount`;
  - `OrderItem.promotionId`;
  - `OrderItem.promotionName`;
  - `OrderItem.promotionSnapshot`.

### API admin mới

- `GET /api/admin/promotions`
- `GET /api/admin/promotions/:id`
- `POST /api/admin/promotions`
- `PUT /api/admin/promotions/:id`
- `PATCH /api/admin/promotions/:id/status`
- `POST /api/admin/promotions/preview/cart`

### UI admin

- Route `/promotions`.
- Menu `Promotion`.
- CRUD promotion cơ bản.
- Chọn product/category từ dữ liệu thật, không nhập ID tay.
- Bật/tạm dừng promotion.

## Migration

Migration mới:

- `server/prisma/migrations/20260711140000_phase5_6_loyalty_promotion/migration.sql`

Đã áp dụng vào DB dev local bằng:

```bash
DATABASE_URL=mysql://root:root@127.0.0.1:3306/app_db?allowPublicKeyRetrieval=true npx prisma migrate deploy
```

Kết quả:

```text
Database schema is up to date!
```

## Kiểm thử đã chạy

```text
npx prisma validate
PASS

npx prisma generate
PASS

npx tsc --noEmit
PASS

npm test -- --runInBand
27 suites passed, 67 tests passed

client-seller npm run lint
0 errors, 13 warnings cũ

client-seller npm run build
PASS

client-next npm run lint
0 errors, 3 warnings cũ

client-next npm run build
PASS

git diff --check
PASS, chỉ có cảnh báo LF/CRLF
```

## Rủi ro và phần còn lại

- Combo cố định và `BUY_X_GET_Y` mới có enum/model chuẩn bị, chưa nối rule đầy đủ trong pricing service/UI.
- Storefront chưa có UI nổi bật giá sale trên trang product/listing; checkout/order đã có snapshot backend.
- Loyalty expire hiện chạy bằng admin action/lazy processor, chưa có worker scheduler riêng.
- Trang loyalty admin điều chỉnh theo `userId`; chưa có picker user thân thiện.
