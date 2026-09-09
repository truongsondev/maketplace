# Prompt triển khai GHN Test API cho dự án hiện tại

Bạn là senior full-stack engineer. Hãy đọc kỹ tài liệu `ghn-test-api-integration.md` và source code hiện tại của repository này, sau đó triển khai tích hợp Giao Hàng Nhanh (GHN) Test API để thay thế flow mock giao hàng. Hệ thống chỉ sử dụng GHN, không tích hợp hoặc giữ lựa chọn đơn vị vận chuyển khác trong nghiệp vụ chính.

## 1. Bối cảnh bắt buộc phải giữ đúng

- Dự án là marketplace/shop thời trang nhỏ, một chi nhánh vật lý, đơn online freeship toàn bộ.
- Không thu phí ship của khách:
  - `orders.shippingFee` phải luôn là `0`.
  - Phí GHN nếu lấy được chỉ dùng đối soát nội bộ, lưu riêng, tuyệt đối không cộng vào tổng tiền khách trả.
- Nếu đơn COD, `cod_amount` gửi GHN bằng tổng tiền khách cần thanh toán sau giảm giá, tức `orders.totalPrice`, không cộng phí ship.
- Nếu đơn PayOS/đã thanh toán online, `cod_amount = 0`.
- Không triển khai multi-carrier, không thêm lựa chọn GHTK/ViettelPost/Grab/Ahamove, không thiết kế marketplace multi-seller/multi-warehouse.
- GHN là đơn vị vận chuyển duy nhất trong hệ thống. Khi tạo vận đơn thành công, lưu `carrierName = "GHN"` và `trackingCode = data.order_code`.

## 2. Các file/khu vực cần đọc trước khi code

Đọc ít nhất các khu vực sau để bám đúng kiến trúc hiện tại:

- `ghn-test-api-integration.md`: tài liệu tích hợp GHN.
- `server/prisma/schema.prisma`: enum/model hiện tại, đặc biệt `Order`, `OrderShippingAddress`, `OrderStatus`, `ReturnFlowStatus`, `OrderStatusHistory`, `AuditLog`.
- `server/src/app.ts`: cách mount module/router, vị trí `createMockOrdersModule`.
- `server/src/module/admin/orders/infrastructure/api/admin-orders.api.ts`: flow admin confirm/pack/ship/deliver/delivery-failed/return-to-store/cancel.
- `server/src/module/mock-orders`: các mock endpoint giao hàng/return hiện tại cần thay thế hoặc giới hạn dev fallback.
- `server/src/module/payment/applications/services/cod-settlement.service.ts`: flow settle COD khi giao thành công.
- `server/src/module/user-profile/loyalty.service.ts`: flow loyalty khi hoàn tất/giao thành công.
- `server/src/module/order` và `server/src/module/payment`: tạo đơn COD/PayOS, snapshot shipping address, invariant `shippingFee = 0`.
- `client-seller/src/services/api.ts` và `client-seller/src/page/order/orders.tsx`: UI admin hiện đang prompt nhập `carrierName`/`trackingCode`.
- `client-next` checkout/address/order detail nếu cần bổ sung chọn mã địa chỉ GHN và hiển thị tracking.

## 3. Trạng thái nội bộ hiện tại cần tôn trọng

Trong source hiện tại enum `OrderStatus` có nhiều trạng thái hơn tài liệu GHN ban đầu:

```text
PENDING, CONFIRMED, PAID, PACKING, SHIPPED, DELIVERY_FAILED,
RETURN_TO_STORE, DELIVERED, COMPLETED, CANCELLED, RETURNED
```

Vì vậy khi map GHN, hãy dùng các trạng thái hiện có một cách hợp lý:

- Tạo vận đơn GHN thành công: `PACKING` hoặc `CONFIRMED` -> `SHIPPED`.
- GHN `delivered`: `SHIPPED` -> `DELIVERED`, set `deliveredAt`, gọi đúng flow COD settlement/loyalty hiện có, idempotent.
- GHN `delivery_fail`: chuyển `SHIPPED` -> `DELIVERY_FAILED` nếu hợp lệ; nếu đang trạng thái khác thì chỉ lưu `providerStatus` và ghi cảnh báo/audit.
- GHN `waiting_to_return`, `return`, `return_transporting`, `return_sorting`, `returning`: ưu tiên lưu `providerStatus`; nếu đơn là COD khách không nhận thì có thể chuyển `DELIVERY_FAILED`/`RETURN_TO_STORE` theo flow hiện tại khi phù hợp.
- GHN `returned`: nếu là đơn giao thất bại trả về shop thì chuyển `RETURN_TO_STORE` hoặc `RETURNED` theo flow hiện hữu của dự án; nếu là return/refund sau giao thì cập nhật `returnStatus = COMPLETED`/return items theo logic return hiện tại.
- GHN `cancel`: chỉ chuyển `CANCELLED` nếu đơn nội bộ cũng đang trong flow hủy hoặc admin đã yêu cầu hủy; nếu không, không tự hủy đơn, chỉ lưu trạng thái và cảnh báo admin.
- GHN `exception`, `damage`, `lost`, `return_fail`: không tự hoàn tiền, không tự đổi sang delivered/cancelled; lưu `providerStatus`, raw webhook, audit/notification để admin xử lý.

Không ép toàn bộ status GHN vào `Order.status`. Cần có shipment status riêng để lưu trạng thái vận chuyển chi tiết.

## 4. GHN API phải dùng

Tạo client gọi GHN Test API theo tài liệu:

- Test base URL: `https://dev-online-gateway.ghn.vn/shiip/public-api`
- Production base URL: `https://online-gateway.ghn.vn/shiip/public-api`
- Header chung:
  - `Token: <GHN_TOKEN>`
  - `ShopId: <GHN_SHOP_ID>` với endpoint yêu cầu shop.
  - `Content-Type: application/json`

Các endpoint GHN cần hỗ trợ phase đầu:

- `GET /master-data/province`
- `GET /master-data/district?province_id=...` hoặc theo đúng docs hiện hành GHN.
- `POST /master-data/ward?district_id=...`
- `POST /v2/shop/all`
- `POST /v2/shipping-order/available-services`
- `POST /v2/shipping-order/fee`
- `POST /v2/shipping-order/preview` nếu bật preview trước khi tạo.
- `POST /v2/shipping-order/create`
- `POST /v2/shipping-order/detail`
- `POST /v2/shipping-order/detail-by-client-code`
- `POST /v2/switch-status/cancel`
- `POST /v2/switch-status/return` nếu cần.
- `POST /v2/switch-status/storing` nếu cần giao lại.
- `POST /v2/a5/gen-token`
- Webhook nội bộ: `POST /api/webhooks/ghn/order-status`

Không hard-code token/shop id. Không commit secret.

## 5. Environment/config cần thêm

Thêm vào `server/.env.example` và config server tương ứng:

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
GHN_PREVIEW_BEFORE_CREATE=false
GHN_HTTP_TIMEOUT_MS=15000
```

Nếu project đang có pattern config riêng, dùng pattern đó. Validate config khi `GHN_ENABLED=true`; khi `false`, không làm server crash vì thiếu token.

## 6. Data model/migration bắt buộc

Ưu tiên thêm bảng shipment riêng, không nhồi raw payload/webhook vào `orders`.

Đề xuất model Prisma:

```prisma
model OrderShipment {
  id                  String   @id @default(uuid()) @db.VarChar(36)
  orderId             String   @unique @map("order_id") @db.VarChar(36)
  provider            String   @db.VarChar(30)
  providerOrderCode   String   @unique @map("provider_order_code") @db.VarChar(120)
  providerStatus      String?  @map("provider_status") @db.VarChar(80)
  serviceId           Int?     @map("service_id")
  serviceTypeId       Int?     @map("service_type_id")
  codAmount           Decimal? @map("cod_amount") @db.Decimal(10, 2)
  externalFee         Decimal? @map("external_fee") @db.Decimal(10, 2)
  rawCreatePayload    Json?    @map("raw_create_payload")
  rawCreateResponse   Json?    @map("raw_create_response")
  rawLatestWebhook    Json?    @map("raw_latest_webhook")
  lastWebhookTime     DateTime? @map("last_webhook_time")
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([provider, providerStatus])
  @@map("order_shipments")
}
```

Bổ sung relation `shipment OrderShipment?` vào `Order`.

Bổ sung mã địa chỉ GHN vào cả user address và snapshot order shipping address nếu phù hợp:

- `UserAddress.ghnProvinceId`
- `UserAddress.ghnDistrictId`
- `UserAddress.ghnWardCode`
- `OrderShippingAddress.ghnProvinceId`
- `OrderShippingAddress.ghnDistrictId`
- `OrderShippingAddress.ghnWardCode`

Nếu phase đầu muốn chỉ bắt buộc trên `OrderShippingAddress`, vẫn cần đảm bảo checkout/admin có cách lưu mã GHN vào snapshot trước khi tạo vận đơn. Backend không nên chỉ resolve bằng tên ward/district/city vì dễ sai.

## 7. Module shipping cần triển khai

Tạo module riêng, bám style Clean Architecture/module hiện tại:

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
      ghn-payload-builder.service.ts
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

Nếu repo có style khác, có thể điều chỉnh, nhưng không viết toàn bộ logic GHN vào một controller lớn.

Mount routes trong `server/src/app.ts`:

- Public/authenticated shipping APIs sau auth nếu cần user.
- Admin APIs dưới `/api/admin`.
- Webhook GHN phải có route public riêng, không bị chặn bởi auth middleware, ví dụ mount trước auth:
  - `POST /api/webhooks/ghn/order-status`

Webhook cần xác thực nếu GHN cung cấp secret/signature. Nếu docs test không có signature rõ ràng, vẫn cấu hình `GHN_WEBHOOK_SECRET` để có thể kiểm tra header/query/body secret nếu đang dùng trong môi trường triển khai, nhưng không tự bịa thuật toán ký không có trong docs.

## 8. API nội bộ cần có

Triển khai các API tối thiểu:

```http
GET /api/shipping/ghn/provinces
GET /api/shipping/ghn/districts?provinceId=...
GET /api/shipping/ghn/wards?districtId=...
POST /api/admin/orders/:orderId/ship/ghn
POST /api/admin/orders/:orderId/shipment/sync
POST /api/admin/orders/:orderId/shipment/cancel
POST /api/admin/orders/:orderId/shipment/print-token
GET /api/orders/:orderId/shipment
POST /api/webhooks/ghn/order-status
```

Quy tắc:

- `POST /api/admin/orders/:orderId/ship/ghn` là endpoint chính để tạo vận đơn GHN.
- Endpoint cũ `POST /api/admin/orders/:orderId/ship` không còn là flow chính. Có thể giữ cho dev/manual fallback khi `GHN_ENABLED=false`, nhưng UI admin khi `GHN_ENABLED=true` phải gọi GHN endpoint, không prompt nhập carrier/tracking thủ công.
- Không cho nhập carrier tự do trong UI chính vì hệ thống chỉ dùng GHN.

## 9. Flow tạo vận đơn GHN

Khi admin bấm bàn giao GHN:

1. Validate order tồn tại.
2. Chỉ cho tạo vận đơn từ `PACKING` hoặc `CONFIRMED` tùy flow hiện tại. Nếu flow hiện tại đã có `packOrder`, ưu tiên yêu cầu đơn ở `PACKING`. Có thể cho `CONFIRMED -> SHIPPED` nếu UI chưa bắt packing, nhưng phải nhất quán.
3. Nếu đã có `OrderShipment` provider `GHN` cho order đó, trả về shipment hiện tại, không tạo vận đơn GHN lần hai.
4. Validate có `OrderShippingAddress`.
5. Validate địa chỉ có `ghnDistrictId` và `ghnWardCode`. Nếu thiếu, trả lỗi rõ ràng để admin/user cập nhật địa chỉ.
6. Validate có item.
7. Build payload GHN:
   - `client_order_code`: dùng `orders.id` hoặc mã đơn hiển thị nếu dự án có, nhưng phải unique và dùng được để sync.
   - `to_name`: recipient từ snapshot.
   - `to_phone`: phone từ snapshot.
   - `to_address`: `addressLine + ward + district + city`.
   - `to_ward_code`: `OrderShippingAddress.ghnWardCode`.
   - `to_district_id`: `OrderShippingAddress.ghnDistrictId`.
   - `cod_amount`: COD = `Number(order.totalPrice)`, PayOS/online = `0`.
   - `payment_type_id`: `1` để shop trả phí GHN, khách vẫn freeship.
   - `required_note`: env `GHN_DEFAULT_REQUIRED_NOTE`, mặc định `KHONGCHOXEMHANG`.
   - `service_type_id`: env `GHN_DEFAULT_SERVICE_TYPE_ID`, mặc định `2`, hoặc dùng `service_id` nếu Get Service bắt buộc.
   - `insurance_value`: giá trị hàng/tổng đơn hợp lệ theo giới hạn GHN.
   - `weight/length/width/height`: lấy từ product/variant nếu có; nếu chưa có thì dùng fallback env.
   - `items`: map từ `OrderItem`, có tên sản phẩm, số lượng, giá, weight/dimensions fallback.
8. Nếu `GHN_PREVIEW_BEFORE_CREATE=true`, gọi preview trước. Preview fail thì không tạo vận đơn.
9. Gọi GHN Create Order.
10. Trong transaction DB:
    - Tạo `OrderShipment`.
    - Lưu raw payload/response.
    - Cập nhật `orders.carrierName = "GHN"`.
    - Cập nhật `orders.trackingCode = data.order_code`.
    - Cập nhật `orders.shippedAt = now()`.
    - Chuyển status sang `SHIPPED`.
    - Ghi `OrderStatusHistory`.
    - Ghi `AuditLog`.
11. Response trả shipment/order status để UI cập nhật.

Nếu GHN create thành công nhưng DB transaction fail, cần có chiến lược recover:

- Vì `client_order_code` là order id, lần retry phải thử `detail-by-client-code` để tìm vận đơn đã tạo trước đó rồi lưu lại, tránh tạo trùng vận đơn.

## 10. Flow webhook GHN

Route:

```http
POST /api/webhooks/ghn/order-status
```

Payload chính từ GHN có thể gồm:

- `OrderCode`
- `ClientOrderCode`
- `Status`
- `Type`
- `Description`
- `Reason`
- `ReasonCode`
- `TotalFee`
- `Fee`
- `CODAmount`
- `CODTransferDate`
- `Time`

Yêu cầu xử lý:

1. Parse payload linh hoạt nhưng type-safe.
2. Tìm shipment theo `providerOrderCode = OrderCode`; fallback theo `ClientOrderCode = order.id`.
3. Nếu chưa tìm thấy, lưu log cảnh báo và trả HTTP 200 để GHN không retry vô hạn; không throw 500 vì payload hợp lệ nhưng order chưa sync.
4. Lưu `rawLatestWebhook`, `providerStatus`, `externalFee` nếu có, `lastWebhookTime`.
5. Idempotent:
   - Webhook trùng không tạo history/settlement/loyalty lần hai.
   - Webhook cũ hơn `lastWebhookTime` không rollback trạng thái nghiệp vụ quan trọng.
   - `delivered` lặp lại không settle COD hai lần.
6. Chỉ đổi `Order.status` ở các mốc nghiệp vụ thật sự.
7. Với `delivered`, gọi flow `codSettlementService.settleOnDelivery` hiện có trước hoặc trong transaction theo pattern hiện tại, nhưng đảm bảo idempotency.
8. Ghi `OrderStatusHistory.changedBy = null` hoặc actor system.
9. Ghi `AuditLog.actorType = SYSTEM`.
10. Trả HTTP 200 nhanh.

## 11. Sync/cancel/print

Triển khai:

- `POST /api/admin/orders/:orderId/shipment/sync`:
  - Gọi GHN detail bằng `providerOrderCode` hoặc `client_order_code`.
  - Cập nhật `providerStatus`, fee, raw response.
  - Áp dụng cùng mapper status như webhook.

- `POST /api/admin/orders/:orderId/shipment/cancel`:
  - Chỉ gọi GHN cancel nếu shipment tồn tại và trạng thái GHN còn cho phép.
  - Sau cancel GHN, cập nhật shipment status.
  - Không tự hủy order nếu nghiệp vụ cancel nội bộ chưa chạy; cần phối hợp flow cancel hiện tại.

- `POST /api/admin/orders/:orderId/shipment/print-token`:
  - Gọi `/v2/a5/gen-token`.
  - Trả token và URL in test/prod tương ứng.

## 12. Thay thế mock API và UI

Backend:

- `server/src/module/mock-orders` không còn là flow chính.
- `/api/mock/orders` chỉ được mount khi `NODE_ENV !== "production"` hoặc `GHN_ENABLED=false`.
- Nếu `GHN_ENABLED=true`, không để UI/admin gọi mock delivered/return pickup/complete.

Admin UI `client-seller`:

- Thay prompt nhập `carrierName`/`trackingCode` trong `orders.tsx` bằng nút/action "Bàn giao GHN".
- Action gọi `POST /api/admin/orders/:orderId/ship/ghn`.
- Hiển thị `carrierName = GHN`, mã vận đơn, trạng thái GHN nếu API trả về.
- Thêm action "Đồng bộ GHN" và "In phiếu GHN" nếu đủ thời gian.
- Không hiển thị lựa chọn đơn vị vận chuyển khác.

Customer UI `client-next`:

- Nếu đã có order detail, hiển thị mã vận đơn/trạng thái cơ bản.
- Không hiển thị phí GHN là phí khách phải trả.

Checkout/address:

- Bổ sung cách lấy province/district/ward GHN và gửi `ghnProvinceId`, `ghnDistrictId`, `ghnWardCode` khi lưu địa chỉ hoặc khi checkout tạo snapshot.
- Nếu chưa làm được UI đầy đủ trong phase đầu, admin endpoint tạo vận đơn phải trả lỗi rõ khi thiếu mã GHN.

## 13. Cache master data GHN

Tối thiểu có cache in-memory/Redis với TTL cho province/district/ward. Nếu dùng DB table riêng thì càng tốt, nhưng không bắt buộc phase đầu.

Không gọi GHN master-data vô hạn mỗi request nếu có thể cache.

## 14. Test bắt buộc

Viết test phù hợp với setup hiện tại của `server`:

- `GhnStatusMapper`:
  - `delivered` -> chuyển nghiệp vụ sang `DELIVERED`.
  - `delivery_fail` -> `DELIVERY_FAILED` hoặc chỉ lưu provider status theo rule.
  - `returned` -> return/returned rule.
  - `exception`, `damage`, `lost` không auto hoàn tiền/delivered.

- Payload builder:
  - COD order gửi `cod_amount = totalPrice`.
  - PayOS/online order gửi `cod_amount = 0`.
  - `orders.shippingFee` không bị dùng để cộng tiền.
  - fallback weight/dimensions hoạt động.

- Create shipment use case:
  - Đã có shipment thì idempotent, không gọi GHN create lần hai.
  - Thiếu `ghnDistrictId`/`ghnWardCode` thì fail trước khi gọi GHN.
  - GHN lỗi thì không đổi order status.

- Webhook:
  - `delivered` cập nhật order và settle COD một lần.
  - Webhook trùng không tạo settlement/history trùng.
  - Webhook cũ không rollback trạng thái.
  - `delivery_fail` không đánh delivered.

- Freeship invariant:
  - `orders.shippingFee` vẫn `0`.
  - GHN fee lưu ở shipment/externalFee, không đổi total customer payment.

## 15. Validation cần chạy

Sau khi code:

- Chạy format/lint/typecheck/test theo script trong `server/package.json`, `client-seller/package.json`, `client-next/package.json` nếu có.
- Nếu có migration Prisma:
  - Tạo migration SQL đúng.
  - Generate Prisma client nếu cần.
- Báo cáo rõ lệnh đã chạy, pass/fail, lỗi còn lại nếu có.

## 16. Tiêu chí nghiệm thu

Chỉ coi hoàn thành khi:

- Có cấu hình GHN trong env example.
- Có GHN client thật gọi Test API.
- Có model/migration lưu shipment GHN và mã địa chỉ GHN.
- Có endpoint tạo vận đơn GHN từ order nội bộ.
- Tạo vận đơn thành công lưu `carrierName = "GHN"`, `trackingCode = order_code`, status `SHIPPED`.
- Có webhook GHN cập nhật trạng thái idempotent.
- `delivered` gọi đúng COD settlement/loyalty flow hiện có.
- Mock API không còn là flow chính và không dùng trong production/GHN enabled.
- UI admin không còn prompt nhập carrier/tracking thủ công khi dùng GHN.
- Không có logic cho đơn vị vận chuyển khác.
- Không phá invariant freeship.

## 17. Những điều không được làm

- Không cộng phí GHN vào `orders.shippingFee` hoặc `orders.totalPrice`.
- Không cho khách chọn đơn vị vận chuyển.
- Không hard-code token/shop id.
- Không tạo vận đơn GHN nhiều lần cho cùng một order.
- Không tự động hoàn tiền khi GHN báo `damage`, `lost`, `exception`.
- Không chuyển trạng thái order lung tung chỉ vì provider status thay đổi.
- Không bỏ qua idempotency webhook.
- Không xóa toàn bộ mock code nếu việc đó làm mất dev fallback; hãy giới hạn bằng `GHN_ENABLED=false`/non-production.

