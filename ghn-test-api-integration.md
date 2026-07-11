# Tai lieu tich hop GHN Test API

Nguon tham khao: https://api.ghn.vn/home/docs/detail

Tai lieu nay mo ta cach thay flow mock giao hang hien tai bang GHN Test API trong du an marketplace thoi trang. Pham vi hien tai chi la tai lieu phan tich va huong dan tich hop, chua trien khai code.

## 1. Boi canh du an hien tai

Shop la shop thoi trang nho, co 1 chi nhanh vat ly va freeship toan bo don online. Vi vay phi ship khong thu cua khach:

- `orders.shippingFee` trong he thong van luon bang `0`.
- Phi GHN tra ve neu co chi la chi phi van hanh noi bo cua shop, khong cong vao tong tien khach phai tra.
- Neu COD, so tien thu ho GHN can thu la tong tien don hang sau giam gia, khong bao gom phi ship.
- Khong can shipping zone, multi-warehouse, marketplace seller, hay tinh phi ship cho khach.

Trong source hien tai:

- Mock giao hang dang nam o `server/src/module/mock-orders`.
- Route mock dang mount tai `/api/mock/orders`.
- Admin chuyen don sang dang giao tai `POST /api/admin/orders/:orderId/ship`, hien chi luu `carrierName`, `trackingCode`, `deliveryNote`.
- Admin/khach co cac trang thai noi bo: `PENDING`, `CONFIRMED`, `PAID`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `RETURNED`.
- Don hang da co snapshot dia chi giao hang tai `order_shipping_addresses`.

Muc tieu khi tich hop GHN:

1. Tao van don GHN khi shop ban giao don online cho don vi giao hang.
2. Luu ma van don GHN vao `orders.trackingCode`.
3. Nhan webhook GHN de cap nhat trang thai don tu dong.
4. Bo dan cac endpoint mock delivered/return pickup/complete.
5. Van giu freeship voi khach, nhung co the luu phi GHN de doi soat noi bo.

## 2. Moi truong GHN

Theo tai lieu GHN:

- Portal staging de tao tai khoan/test token: `5sao.ghn.dev`
- Portal production: `khachhang.ghn.vn`
- API test base URL: `https://dev-online-gateway.ghn.vn/shiip/public-api`
- API production base URL: `https://online-gateway.ghn.vn/shiip/public-api`

Header chung:

| Header | Bat buoc | Ghi chu |
| --- | --- | --- |
| `Token` | Co | Token GHN cap cho client/shop |
| `ShopId` | Tuy endpoint | Bat buoc voi create/cancel/return/fee/leadtime |
| `Content-Type` | Co | `application/json` |

Bien moi truong nen them vao `server/.env.example` khi trien khai:

```env
GHN_ENABLED=false
GHN_ENV=test
GHN_BASE_URL=https://dev-online-gateway.ghn.vn/shiip/public-api
GHN_TOKEN=
GHN_SHOP_ID=
GHN_CLIENT_ID=
GHN_FROM_NAME=
GHN_FROM_PHONE=
GHN_FROM_ADDRESS=
GHN_FROM_WARD_CODE=
GHN_FROM_WARD_NAME=
GHN_FROM_DISTRICT_ID=
GHN_FROM_DISTRICT_NAME=
GHN_FROM_PROVINCE_NAME=
GHN_RETURN_PHONE=
GHN_RETURN_ADDRESS=
GHN_RETURN_WARD_CODE=
GHN_RETURN_DISTRICT_ID=
GHN_WEBHOOK_SECRET=
GHN_DEFAULT_SERVICE_TYPE_ID=2
GHN_DEFAULT_REQUIRED_NOTE=KHONGCHOXEMHANG
GHN_DEFAULT_WEIGHT_GRAM=500
GHN_DEFAULT_LENGTH_CM=20
GHN_DEFAULT_WIDTH_CM=15
GHN_DEFAULT_HEIGHT_CM=5
```

Ghi chu:

- `GHN_ENV=test` dung staging/test endpoint.
- `GHN_DEFAULT_SERVICE_TYPE_ID=2` tuong ung dich vu chuan/e-commerce delivery theo docs GHN.
- `GHN_DEFAULT_REQUIRED_NOTE=KHONGCHOXEMHANG` phu hop thoi trang neu shop khong muon khach mo thu hang.
- Can lay `GHN_SHOP_ID` bang API Get Store hoac trong portal GHN.

## 3. Cac API GHN can dung

### 3.1 Lay tinh/thanh, quan/huyen, phuong/xa

Dung de map dia chi khach trong he thong sang ma dia chi GHN.

| Nghiep vu | Method | Test endpoint | Du lieu chinh |
| --- | --- | --- | --- |
| Lay tinh/thanh | GET | `/master-data/province` | `ProvinceID`, `ProvinceName` |
| Lay quan/huyen | GET | `/master-data/district` | `province_id` -> `DistrictID`, `DistrictName` |
| Lay phuong/xa | POST | `/master-data/ward?district_id` | `district_id` -> `WardCode`, `WardName` |

Khuyen nghi:

- Tao bang/cache rieng cho `GHNProvince`, `GHNDistrict`, `GHNWard`, hoac cache Redis.
- Khong nen chi luu ten ward/district/city nhu hien tai neu muon tao don GHN on dinh.
- Khi checkout, frontend nen gui them `ghnDistrictId` va `ghnWardCode`, hoac backend tu resolve tu dia chi da chon.

### 3.2 Lay danh sach shop/kho lay hang

| Nghiep vu | Method | Test endpoint |
| --- | --- | --- |
| Get Store | POST | `/v2/shop/all` |

Dung de xac minh `GHN_SHOP_ID`, dia chi lay hang, `district_id`, `ward_code`.

Voi shop 1 chi nhanh, nen cau hinh co dinh `GHN_SHOP_ID` va dia chi shop trong env/admin settings, khong can model multi-store.

### 3.3 Lay dich vu van chuyen

| Nghiep vu | Method | Test endpoint |
| --- | --- | --- |
| Get Service | POST | `/v2/shipping-order/available-services` |

Request can:

```json
{
  "shop_id": 885,
  "from_district": 1447,
  "to_district": 1442
}
```

Response tra ve `service_id`, `short_name`, `service_type_id`.

Khuyen nghi:

- Neu khong can cho admin chon dich vu, dung `service_type_id=2`.
- Neu GHN yeu cau `service_id`, goi Get Service truoc khi create order va chon service Standard/Chuan.

### 3.4 Tinh phi giao hang

| Nghiep vu | Method | Test endpoint |
| --- | --- | --- |
| Calculate Fee | POST | `/v2/shipping-order/fee` |
| Fee of Order Info | POST | `/v2/shipping-order/soc` hoac endpoint theo docs GHN hien hanh |

Request chinh:

```json
{
  "from_district_id": 1454,
  "from_ward_code": "21211",
  "service_id": 53320,
  "service_type_id": null,
  "to_district_id": 1452,
  "to_ward_code": "21012",
  "height": 5,
  "length": 20,
  "weight": 500,
  "width": 15,
  "insurance_value": 100000,
  "coupon": null,
  "items": [
    {
      "name": "Ao thun",
      "quantity": 1,
      "height": 5,
      "weight": 500,
      "length": 20,
      "width": 15
    }
  ]
}
```

Response co `total`, `service_fee`, `insurance_fee`, `cod_fee`, cac phi vung xa...

Quy tac cua du an:

- Khong hien phi nay cho khach nhu mot khoan phai tra.
- Neu can doi soat, them cot rieng nhu `externalShippingFee`/`ghnFeeTotal`, khong dung `orders.shippingFee`.
- Checkout total khach tra khong thay doi.

### 3.5 Preview Order

| Nghiep vu | Method | Test endpoint |
| --- | --- | --- |
| Preview Order | POST | `/v2/shipping-order/preview` |

Dung de test payload truoc khi tao van don that tren GHN. Nen dung trong giai do staging de debug dia chi, kich thuoc, COD, service.

### 3.6 Tao van don GHN

| Nghiep vu | Method | Test endpoint |
| --- | --- | --- |
| Create Order | POST | `/v2/shipping-order/create` |

Header:

```http
Token: <GHN_TOKEN>
ShopId: <GHN_SHOP_ID>
Content-Type: application/json
```

Payload can map tu order noi bo:

| GHN field | Mapping trong du an |
| --- | --- |
| `client_order_code` | `orders.id` hoac ma don hien thi noi bo |
| `to_name` | `OrderShippingAddress.recipientName` |
| `to_phone` | `OrderShippingAddress.phone` |
| `to_address` | `addressLine + ward/district/city` |
| `to_ward_code` | Ma phuong/xa GHN, can bo sung |
| `to_district_id` | Ma quan/huyen GHN, can bo sung |
| `cod_amount` | Neu COD: `orders.totalPrice`; PayOS: `0` |
| `payment_type_id` | `1` neu shop tra phi GHN; noi bo van freeship |
| `required_note` | `KHONGCHOXEMHANG` hoac cau hinh env |
| `service_type_id` | Mac dinh `2` neu khong dung `service_id` |
| `insurance_value` | Tong gia tri hang, gioi han theo GHN |
| `weight/length/width/height` | Tu variant/product neu co, fallback env |
| `items` | Tu `OrderItem`, product name/code/quantity/price |

Sau khi tao thanh cong:

- Luu `data.order_code` vao `orders.trackingCode`.
- Luu `carrierName = "GHN"`.
- Luu `shippedAt = now()`.
- Chuyen `Order.status` noi bo sang `SHIPPED`.
- Ghi `OrderStatusHistory` va `AuditLog`.

Nen tao bang rieng de luu metadata GHN:

```prisma
model OrderShipment {
  id              String   @id @default(uuid())
  orderId         String   @unique
  provider        String
  providerOrderCode String @unique
  providerStatus  String?
  serviceId       Int?
  serviceTypeId   Int?
  codAmount       Decimal?
  externalFee     Decimal?
  rawCreatePayload Json?
  rawCreateResponse Json?
  rawLatestWebhook Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

Co the don gian hon bang cach them cot vao `orders`, nhung bang rieng tot hon vi payload/webhook GHN kha nhieu truong.

### 3.7 Lay chi tiet/tracking don

| Nghiep vu | Method | Test endpoint |
| --- | --- | --- |
| Order Info | POST | `/v2/shipping-order/detail` |
| Order Info by Client Order Code | POST | `/v2/shipping-order/detail-by-client-code` |

Dung cho:

- Man hinh admin bam dong bo trang thai.
- Job reconcile phong khi webhook mat.
- Khach xem tracking neu can.

Nen expose API noi bo:

```http
GET /api/orders/:orderId/shipment
POST /api/admin/orders/:orderId/shipment/sync
```

### 3.8 Huy, hoan, giao lai

| Nghiep vu | Method | Test endpoint | Khi dung |
| --- | --- | --- | --- |
| Cancel Order | POST | `/v2/switch-status/cancel` | Huy van don GHN khi don noi bo bi huy truoc khi GHN giao |
| Return Order | POST | `/v2/switch-status/return` | Yeu cau GHN tra hang ve shop khi don dang luu kho/cho giao |
| Delivery Again | POST | `/v2/switch-status/storing` | Yeu cau giao lai sau khi giao that bai |
| Update COD | POST | `/v2/shipping-order/updateCOD` | Chi dung neu COD amount thay doi truoc khi GHN khoa don |
| Update Order | POST | `/v2/shipping-order/update` | Cap nhat ghi chu/dia chi/COD khi GHN con cho phep |

Voi nghiep vu hien tai cua shop:

- Neu khach huy don sau khi da tao van don, goi GHN Cancel neu trang thai GHN con cho phep.
- Neu khach khong nhan hang, webhook GHN se dua vao cac status fail/return; he thong noi bo cap nhat return flow.
- Neu loi san pham va shop hoan tien, do la return/refund noi bo; khong coi la bao hanh.

### 3.9 In phieu giao hang

| Nghiep vu | Method | Test endpoint |
| --- | --- | --- |
| Print Order token | POST | `/v2/a5/gen-token` |

Sau khi lay token in, mo link:

- Test A5: `https://dev-online-gateway.ghn.vn/a5/public-api/printA5?token=<token>`
- Test 80x80: `https://dev-online-gateway.ghn.vn/a5/public-api/print80x80?token=<token>`
- Test 50x72: `https://dev-online-gateway.ghn.vn/a5/public-api/print52x70?token=<token>`

Nen them action admin:

```http
POST /api/admin/orders/:orderId/shipment/print-token
```

### 3.10 Pick Shift va Leadtime

| Nghiep vu | Method | Test endpoint |
| --- | --- | --- |
| Pick Shift | GET | `/v2/shift/date` |
| Leadtime | POST | `/v2/shipping-order/leadtime` |

Dung neu admin muon chon ca lay hang hoac hien du kien giao. Ban dau co the bo qua pick shift va de GHN mac dinh, sau do bo sung.

## 4. Webhook GHN

GHN co webhook `Callback order status`. Can cung cap cho GHN:

- Client ID
- URL webhook staging/production
- Moi truong test hay production

De xuat route:

```http
POST /api/webhooks/ghn/order-status
```

Payload webhook chinh gom:

- `OrderCode`: ma van don GHN
- `ClientOrderCode`: ma don noi bo neu khi create co gui
- `Status`: trang thai GHN
- `Type`: create/switch_status/update...
- `Description`, `Reason`, `ReasonCode`
- `TotalFee`, `Fee`
- `CODAmount`, `CODTransferDate`
- `Time`

Yeu cau xu ly:

1. Tim `OrderShipment` theo `providerOrderCode = OrderCode`, fallback theo `ClientOrderCode`.
2. Luu raw webhook moi nhat.
3. Idempotent: neu webhook cu hon status hien tai hoac da xu ly event tuong tu thi khong lap transition nguy hiem.
4. Map status GHN sang status noi bo.
5. Ghi `OrderStatusHistory` voi `changedBy = null` hoac actor system.
6. Neu status GHN la `delivered`, goi settlement COD va loyalty nhu flow delivered hien tai.
7. Tra HTTP 200 de GHN khong retry.

Can luu log loi rieng. Theo docs, neu response khac 200 GHN co the retry nhieu lan, nen webhook phai nhanh va idempotent.

## 5. Mapping trang thai GHN sang trang thai noi bo

Danh sach status GHN theo docs:

| GHN status | Nghia | Mapping noi bo de xuat |
| --- | --- | --- |
| `ready_to_pick` | Van don moi tao | Giu `SHIPPED` hoac them shipment status rieng |
| `picking` | Shipper dang den lay | Giu `SHIPPED` |
| `money_collect_picking` | Shipper tuong tac voi shop | Giu `SHIPPED` |
| `picked` | Da lay hang | Giu `SHIPPED` |
| `storing` | Hang tai kho GHN | Giu `SHIPPED` |
| `sorting` | Dang phan loai | Giu `SHIPPED` |
| `transporting` | Dang luan chuyen | Giu `SHIPPED` |
| `delivering` | Dang giao cho khach | Giu `SHIPPED` |
| `money_collect_delivering` | Dang thu tien nguoi mua | Giu `SHIPPED` |
| `delivered` | Giao thanh cong | Chuyen `DELIVERED` |
| `delivery_fail` | Giao that bai | Giu `SHIPPED`, luu `providerStatus`, hien can xu ly |
| `waiting_to_return` | Cho tra hang | Bat dau flow return van chuyen |
| `return` | Dang cho tra ve shop | `returnStatus = SHIPPING` neu co return flow |
| `return_transporting` | Hang dang tra ve | `returnStatus = SHIPPING` |
| `return_sorting` | Hang tra dang phan loai | `returnStatus = SHIPPING` |
| `returning` | Shipper dang tra hang shop | `returnStatus = SHIPPING` |
| `returned` | Da tra ve shop | `RETURNED` hoac `returnStatus = COMPLETED` tuy nghiep vu |
| `return_fail` | Tra hang that bai | Giu trang thai, can admin xu ly |
| `cancel` | Van don bi huy | Neu don noi bo huy: `CANCELLED`; neu khong thi can canh bao |
| `exception` | Bat thuong | Khong auto doi status don, tao canh bao admin |
| `damage` | Hang hu hong | Tao canh bao, can admin xu ly hoan tien |
| `lost` | That lac | Tao canh bao, can admin xu ly hoan tien |

Khuyen nghi quan trong:

- Khong nen ep tat ca status GHN vao `OrderStatus`, vi `OrderStatus` noi bo dang qua it trang thai.
- Nen them `OrderShipment.providerStatus` va chi doi `Order.status` khi co moc nghiep vu that su: tao van don, giao thanh cong, huy, tra ve.

## 6. Flow thay mock bang GHN

### Flow tao van don

1. Admin xac nhan don: `PENDING/PAID` -> `CONFIRMED`.
2. Admin bam "Ban giao GHN".
3. Backend validate:
   - Don dang `CONFIRMED`.
   - Co snapshot dia chi.
   - Co `ghnDistrictId`, `ghnWardCode` hoac resolve duoc.
   - Co item, can nang/kich thuoc fallback hop le.
4. Backend goi GHN Preview Order trong test neu `GHN_PREVIEW_BEFORE_CREATE=true`.
5. Backend goi GHN Create Order.
6. Backend luu shipment, `carrierName = GHN`, `trackingCode = order_code`, `status = SHIPPED`.

### Flow giao thanh cong

1. GHN gui webhook `Status = delivered`.
2. Backend tim order theo `OrderCode`.
3. Neu order dang `SHIPPED`, goi `codSettlementService.settleOnDelivery`.
4. Chuyen `Order.status = DELIVERED`, set `deliveredAt`.
5. Ghi history/audit/notification.

Endpoint mock `POST /api/mock/orders/:orderId/deliver` se khong can dung nua.

### Flow giao that bai/tra hang

1. GHN gui `delivery_fail`, `waiting_to_return`, `return`, `returning`...
2. Backend luu `providerStatus` va hien canh bao admin.
3. Khi GHN `returned`, shop da nhan lai hang:
   - Neu day la don khach khong nhan: cap nhat `Order.status = RETURNED` hoac flow rieng.
   - Neu day la return/refund da duyet: cap nhat `Return.status = RT_COMPLETED`, `Order.returnStatus = COMPLETED`.
4. Hoan tien neu nghiep vu yeu cau.

Endpoint mock `returns/pickup` va `returns/complete` se duoc thay bang webhook/sync GHN, nhung van co the giu trong dev neu `GHN_ENABLED=false`.

## 7. Thiet ke module de xuat

Tao module moi:

```text
server/src/module/shipping/
  di.ts
  applications/
    dto/
    ports/
      input/
      output/
    services/
      ghn-status-mapper.service.ts
    use-cases/
      create-ghn-shipment.usecase.ts
      sync-ghn-shipment.usecase.ts
      handle-ghn-webhook.usecase.ts
      cancel-ghn-shipment.usecase.ts
      print-ghn-label.usecase.ts
  infrastructure/
    api/
      admin-shipping.api.ts
      public-shipping.api.ts
      ghn-webhook.api.ts
    ghn/
      ghn.client.ts
      ghn.config.ts
    repositories/
      prisma-shipment.repository.ts
```

Public/admin API noi bo de xuat:

| API noi bo | Muc dich |
| --- | --- |
| `GET /api/shipping/ghn/provinces` | Lay/cache tinh thanh GHN |
| `GET /api/shipping/ghn/districts?provinceId=` | Lay/cache quan huyen |
| `GET /api/shipping/ghn/wards?districtId=` | Lay/cache phuong xa |
| `POST /api/admin/orders/:orderId/ship/ghn` | Tao van don GHN va chuyen order sang `SHIPPED` |
| `POST /api/admin/orders/:orderId/shipment/sync` | Dong bo order detail tu GHN |
| `POST /api/admin/orders/:orderId/shipment/cancel` | Huy van don GHN |
| `POST /api/admin/orders/:orderId/shipment/print-token` | Lay token in phieu |
| `GET /api/orders/:orderId/shipment` | Khach xem tracking co ban |
| `POST /api/webhooks/ghn/order-status` | Nhan webhook GHN |

## 8. Data model can bo sung

Toi thieu:

- Them ma GHN vao dia chi:
  - `OrderShippingAddress.ghnDistrictId`
  - `OrderShippingAddress.ghnWardCode`
  - co the them `ghnProvinceId`
- Them shipment table rieng:
  - provider = `GHN`
  - provider order code
  - provider status
  - external fee
  - raw request/response/webhook

Neu muon lam gon hon cho phase 1:

- Dung `orders.carrierName = "GHN"`.
- Dung `orders.trackingCode = GHN order_code`.
- Them `orders.externalShippingFee` va `orders.externalShippingStatus`.

Nhung ve dai han, bang `OrderShipment` sach hon.

## 9. Xu ly loi va idempotency

Can xu ly cac case:

- GHN token sai: tra loi 401/400, backend khong doi status noi bo.
- Dia chi chua co `district_id/ward_code`: khong goi GHN, yeu cau cap nhat dia chi.
- Tao van don thanh cong nhung DB update fail: can co retry/sync bang `client_order_code`.
- Admin bam tao van don nhieu lan: neu da co shipment thi tra ve shipment hien tai, khong tao van don moi.
- Webhook lap lai: khong lap settlement COD, loyalty, history.
- Webhook den sai thu tu: luu raw status, chi transition khi hop le.
- GHN tra `damage/lost/exception`: khong auto hoan tien, tao canh bao admin.

## 10. Ke hoach trien khai de xuat

Phase 1 - Nen tang:

1. Them env GHN va `GhnClient`.
2. Them API cache province/district/ward.
3. Bo sung ma GHN vao shipping address tai checkout.
4. Them migration `OrderShipment`.

Phase 2 - Tao van don:

1. Them `POST /api/admin/orders/:orderId/ship/ghn`.
2. Map order noi bo sang payload GHN.
3. Goi Preview/Create tren test.
4. Luu `trackingCode`, `carrierName`, shipment metadata.
5. Cap nhat UI admin de nut "Ban giao GHN" thay prompt nhap tay.

Phase 3 - Webhook va sync:

1. Them webhook `/api/webhooks/ghn/order-status`.
2. Map status GHN sang status noi bo.
3. Them sync endpoint fallback.
4. Test delivered/COD/return/lost/damage.

Phase 4 - Bo mock:

1. Giu `/api/mock/orders` chi khi `NODE_ENV !== production` hoac `GHN_ENABLED=false`.
2. UI khong goi mock khi GHN enabled.
3. Cap nhat docs/test manual.

## 11. Test can co

Unit test:

- `GhnStatusMapper`: map `delivered`, `returned`, `cancel`, `exception`.
- `CreateGhnShipmentUseCase`: idempotent khi da co shipment.
- Payload builder: PayOS => `cod_amount = 0`; COD => `cod_amount = totalPrice`.
- Freeship invariant: `orders.shippingFee` luon bang `0`.

Integration test:

- Tao shipment GHN test thanh cong.
- Webhook `delivered` cap nhat order va settle COD mot lan.
- Webhook lap lai khong tao history/settlement trung.
- Webhook `delivery_fail` chi luu shipment status, khong danh delivered.
- Cancel order goi GHN cancel khi shipment ton tai.

Manual test tren GHN staging:

1. Tao token/shop tren `5sao.ghn.dev`.
2. Lay province/district/ward.
3. Tao don COD freeship.
4. Tao shipment GHN.
5. In phieu giao hang.
6. Gia lap/cau hinh webhook va kiem tra status.
7. Dong bo bang Order Info khi webhook khong ve.

## 12. Cac diem can quyet dinh truoc khi code

1. Dia chi hien tai co nen bat buoc chon tu GHN province/district/ward hay cho backend resolve theo ten?
   - Khuyen nghi: bat buoc chon tu GHN de tranh sai ten.
2. Khi GHN `returned`, order noi bo nen la `RETURNED` hay chi cap nhat return flow?
   - Khuyen nghi: don khach khong nhan thi `RETURNED`; return/refund sau giao thi dung `returnStatus`.
3. Co luu phi GHN de doi soat khong?
   - Khuyen nghi: co, nhung luu rieng `externalFee`, khong anh huong `shippingFee=0`.
4. Co cho khach xem link tracking GHN truc tiep khong?
   - Khuyen nghi: phase 1 chi hien ma van don va status noi bo; phase sau them tracking detail.

## 13. Prompt yeu cau AI trien khai sau tai lieu nay

Neu muon AI thuc hien code o buoc tiep theo, co the dung prompt:

```text
Doc file ghn-test-api-integration.md va source hien tai. Hay tich hop GHN Test API thay cho mock giao hang theo tung phase an toan.

Pham vi:
- Shop thoi trang 1 chi nhanh, freeship toan bo don online.
- Khong thay doi logic orders.shippingFee = 0.
- GHN fee neu co chi luu de doi soat noi bo, khong thu cua khach.
- COD thi cod_amount gui GHN bang totalPrice cua don; PayOS thi cod_amount = 0.
- Tao module shipping rieng, khong nhieu chi nhanh, khong marketplace.

Yeu cau:
1. Them config/env GHN test.
2. Tao GhnClient dung base URL test/dev.
3. Them migration/model can thiet de luu shipment GHN va ma dia chi GHN.
4. Them API cache province/district/ward GHN.
5. Them endpoint admin tao van don GHN tu order da CONFIRMED.
6. Luu carrierName = GHN, trackingCode = order_code, status = SHIPPED.
7. Them webhook GHN order status, xu ly idempotent.
8. Map delivered sang DELIVERED va goi COD settlement/loyalty dung flow hien tai.
9. Giu mock API chi cho dev fallback khi GHN_ENABLED=false.
10. Cap nhat UI admin neu can de dung GHN thay prompt nhap tay.
11. Viet test cho payload builder, status mapper, idempotency webhook, freeship invariant.
12. Chay validate/typecheck/test lien quan va ghi bao cao ket qua.
```
