# Bao cao trien khai Phase 1-4

Ngay kiem tra: 2026-07-11. Pham vi: `rcm-missing-features-prompt.md`, Phase 0 den Phase 4.

## Phase 0 - Audit

| Nghiep vu | Truoc thay doi | Ket qua |
|---|---|---|
| Order pricing snapshot | Co `OrderItem.price`, chua co snapshot ten/SKU/anh/attributes/breakdown | Da bo sung model, migration, checkout writer va order readers |
| PayOS/COD lifecycle | Co PayOS webhook va COD settlement; COD admin co the confirm PENDING | Da them PACKING, DELIVERY_FAILED, RETURN_TO_STORE, COMPLETED |
| Order state/history/audit | Co history va audit, thieu reason va cac trang thai fulfilment | Da bo sung reason va audit cho transition moi |
| Physical sale | Co POST/list backend, chua co UI/idempotency/huy | Da co UI admin, catalog, checkout, receipt, list/detail va cancel/reverse stock |
| Inventory reservation | Co conditional update va reservation online | POS tinh sellable = onHand - reserved, conditional update chong oversell |
| Voucher targeting | Chi ALL_PRODUCTS/toan subtotal | Da co scope quan he va allocation theo dong |
| Promotion | Chua co | Ngoai pham vi Phase 1-4 |
| Loyalty | Co ledger va earn co ban | Ngoai pham vi Phase 1-4 |
| Return/refund | Co mot phan | Reader dung snapshot; flow kiem dinh ngoai pham vi Phase 1-4 |
| Size recommendation | Backend toi thieu | Ngoai pham vi Phase 1-4 |
| Dashboard/audit/security | Co mot phan | Route admin da duoc bao ve boi middleware hien tai; audit bo sung cho POS/COD |

Rui ro tim thay: order reader lay lai catalog hien tai; COD thieu buoc dong goi/that bai; POS khong co idempotency va UI; voucher tinh discount tren toan gio; migration moi chua duoc apply production.

## Phase 1 - Snapshot san pham va pricing

- `OrderItem`: ten, SKU, attributes, anh, gia goc/gia ban, line subtotal/discount/total, eligibility va `snapshotSource`.
- `Order`: `itemsSubtotal - productDiscount - voucherDiscount + shippingFee = grandTotal`.
- Checkout PayOS va COD cung di qua `PrismaPaymentRepository` va `VoucherCheckoutService`.
- Legacy backfill duoc danh dau `LEGACY_BACKFILL`.
- API khach/admin uu tien snapshot, chi fallback catalog cho du lieu legacy.
- Migration: `20260711100000_phase1_order_pricing_snapshot`.

## Phase 2 - COD lifecycle

State moi:

`PENDING/PAID -> CONFIRMED -> PACKING -> SHIPPED -> DELIVERED -> COMPLETED`

Nhanh loi:

`SHIPPED -> DELIVERY_FAILED -> RETURN_TO_STORE`

- Admin UI hien `Xac nhan COD - Chua thu tien`.
- COD chi PAID trong `CodSettlementService` luc giao thanh cong; conditional update ngan thu/tru ton hai lan.
- Hang COD giao loi chi release reservation khi xac nhan da ve shop.
- Endpoint moi: `POST /api/admin/orders/:id/pack`, `/delivery-failed`, `/return-to-store`, `/complete`.
- Migration: `20260711110000_phase2_cod_lifecycle`.

## Phase 3 - Ban tai cua hang

- Route admin `/physical-sales`, tim ten/SKU, xem sellable stock, gio hang, CASH/BANK_TRANSFER/CARD.
- Backend khong nhan gia client; doc gia/snapshot trong transaction va conditional update ton.
- `Idempotency-Key` bat buoc; retry tra ve giao dich cu.
- Co ma giao dich, paidAt, cashier, snapshot item, inventory log `PHYSICAL_STORE`, audit.
- Huy giao dich la reverse transaction, phuc hoi ton dung mot lan; khong xoa lich su.
- Co danh sach, xem/in hoa don va nut huy/hoan.
- Migration: `20260711120000_phase3_physical_sale_operations`.

API chinh: `GET /api/admin/products/physical-sales/catalog`, `POST/GET /api/admin/products/physical-sales`, `GET /:id`, `POST /:id/cancel`.

## Phase 4 - Voucher targeting

- Scope: ALL_PRODUCTS, INCLUDE_CATEGORIES, INCLUDE_PRODUCTS, MEMBER_TIERS.
- Include/exclude luu bang quan he; exclude uu tien.
- `includeDescendants`; min amount theo eligible subtotal mac dinh hoac cart subtotal.
- Fixed discount bi cap boi eligible subtotal; percentage van dung maxDiscount.
- Checkout allocation discount theo dong va snapshot vao `OrderItem`.
- Quota duoc claim bang conditional update trong transaction payment; usage idempotent theo order.
- Admin UI quan ly scope, descendants, tier va exclusion.
- Migration: `20260711130000_phase4_voucher_targeting`.

## Kiem thu thuc te

- Prisma validate/generate: pass.
- Backend `npx tsc --noEmit`: pass.
- Backend Jest: 26 suites, 65 tests pass.
- Client admin lint: pass voi 13 warning ton tai; build pass.
- Client khach lint: pass voi 3 warning ton tai; build pass.
- Test moi voucher: ngoai category, descendants va include/exclude conflict.

## Con lai va cach kiem thu thu cong

- Chua apply migration vao production. Can backup DB, chay `prisma migrate deploy` tren staging, kiem tra backfill roi moi production.
- UI voucher hien nhap/search theo ID; can nang cap autocomplete product/category neu catalog lon.
- Chua co E2E browser tu dong cho POS/COD; backend unit/integration hien tai da pass.
- Thu cong: tao cung gio PayOS/COD va so snapshot; doi ten/gia catalog roi mo don cu; cho COD di du state; mo hai tab POS ban SKU con 1; tao voucher category va gio hon hop; retry cung Idempotency-Key.

Rollback: backup truoc deploy. Phase 1/3 co backfill va Phase 2 thay enum nen rollback bang restore backup hoac migration forward sua schema; khong drop cot tren production khi chua export snapshot/giao dich.
