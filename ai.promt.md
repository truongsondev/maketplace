# FULL IMPLEMENTATION PROMPT — AI VIRTUAL TRY-ON IDM-VTON

## ROLE

Bạn là:

- Senior Fullstack Engineer
- Senior Backend Engineer
- Senior Frontend Engineer
- Senior AI Integration Engineer
- Senior Cloudinary/Image Processing Engineer
- Senior Security Engineer
- Senior System Architect

Hãy triển khai hoàn chỉnh tính năng:

> AI Virtual Try-On cho website bán đồ thời trang

Sử dụng model Replicate:

- Model: `cuuupid/idm-vton`
- Documentation: `https://replicate.com/cuuupid/idm-vton`
- Chức năng: user upload ảnh cá nhân, chọn sản phẩm thời trang, hệ thống tạo ảnh user đang mặc sản phẩm đó.

Lưu ý quan trọng:

- Trang Replicate ghi model này là `Non-commercial use only`.
- Không hardcode provider vào business logic. Hãy thiết kế provider interface để sau này đổi model/provider thương mại khác mà không phải viết lại toàn bộ flow.
- Không gọi Replicate trực tiếp từ frontend.
- Không expose `REPLICATE_API_TOKEN` ra browser.

---

# PROJECT CONTEXT

Repo hiện tại là marketplace/e-commerce thời trang, gồm:

```txt
root/
  server/        # Node.js + Express + TypeScript + Prisma
  client-next/   # Next.js + TypeScript + TailwindCSS
  ai-service/    # Python + FastAPI
  infra/
  nginx/
  docker-compose.dev.yml
  docker-compose.prod.yml
```

Hãy đọc code hiện có trước khi sửa:

- Backend clean architecture: tham khảo các module trong `server/src/module/*`
- Product detail frontend: tham khảo `client-next/app/(page)/product/[id]/page.tsx`
- Product detail component: tham khảo `client-next/components/page/product/product-detail-content.tsx`
- AI service hiện có: `ai-service/app/main.py`
- Cloudinary flow hiện có: tìm trong `server/src/module/**/cloudinary*`
- API routing/DI hiện có: tham khảo `server/src/module/*/di.ts` và `server/src/module/*/infrastructure/api/*.ts`

Không phá vỡ các tính năng hiện có.

---

# GOAL

Triển khai end-to-end feature:

1. Khi user đã đăng nhập vào website và chưa có thông tin cơ thể, frontend hiển thị modal lấy `tuổi`, `chiều cao`, `cân nặng`.
2. Backend lưu 3 thông tin này vào database để dùng cho recommendation và ngữ cảnh thử đồ.
3. User vào trang chi tiết sản phẩm.
4. User bấm `Thử đồ bằng AI`.
5. User upload ảnh cá nhân hoặc dùng ảnh đã upload.
6. Frontend gửi request tạo Virtual Try-On.
7. Backend validate product, user, ảnh, rate limit và tạo record database.
8. Backend gọi `ai-service`.
9. `ai-service` gọi Replicate model `cuuupid/idm-vton`.
10. Backend poll/truy vấn trạng thái prediction.
11. Khi thành công, lưu ảnh output vào Cloudinary.
12. User xem kết quả và lịch sử thử đồ.
13. Admin xem analytics cơ bản.

---

# USER BODY PROFILE REQUIREMENTS

Trước khi triển khai VTON, bổ sung tính năng thu thập thông tin cơ thể người dùng để recommendation tốt hơn.

Thông tin cần lấy:

- `age`: tuổi
- `heightCm`: chiều cao tính bằng cm
- `weightKg`: cân nặng tính bằng kg

## UX Flow

Triển khai modal trong `client-next`:

1. Khi user đã đăng nhập và vào website, frontend gọi API lấy body profile hiện tại.
2. Nếu user chưa có đủ `age`, `heightCm`, `weightKg`, hiển thị modal.
3. Modal yêu cầu nhập đủ 3 thông tin.
4. User bấm lưu, frontend gọi API cập nhật profile.
5. Sau khi lưu thành công, modal đóng và không hiện lại ở các lần vào web sau.
6. Nếu user chưa đăng nhập, không hiện modal; chỉ kiểm tra sau khi đăng nhập thành công.

Yêu cầu UX:

- Modal phải xuất hiện ở layout/root client component để hoạt động trên toàn website.
- Không chặn trải nghiệm với user chưa đăng nhập.
- Với user đã đăng nhập nhưng chưa nhập thông tin, modal có thể cho phép `Để sau`, nhưng nếu chọn `Để sau` thì chỉ ẩn trong session hiện tại bằng `sessionStorage`, không đánh dấu là đã hoàn thành trong DB.
- Form phải có validation realtime và message tiếng Việt thân thiện.
- Không hỏi các thông tin nhạy cảm khác ngoài 3 trường trên.

## Validation

Bắt buộc:

- `age`: integer, từ `13` đến `100`
- `heightCm`: integer hoặc decimal, từ `100` đến `230`
- `weightKg`: integer hoặc decimal, từ `30` đến `250`

Nếu dữ liệu không hợp lệ, trả error code rõ ràng và message tiếng Việt.

## Recommendation Usage

Sau khi lưu, dữ liệu body profile phải được dùng làm tín hiệu cho recommendation:

- Ưu tiên sản phẩm/size phù hợp nếu hệ thống có size chart hoặc variant size.
- Dùng `age`, `heightCm`, `weightKg` như metadata trong ranking context.
- Không loại bỏ toàn bộ sản phẩm chỉ vì thiếu mapping size; dùng làm soft signal.
- Nếu recommendation service hiện tại chưa hỗ trợ full size matching, hãy lưu dữ liệu và truyền kèm context vào recommendation API để sẵn sàng mở rộng.

Không dùng dữ liệu cơ thể để hiển thị nhận xét tiêu cực về người dùng.

## Backend Scope For Body Profile

Triển khai API riêng cho body profile của user hiện tại:

```http
GET /api/users/me/body-profile
Authorization: Bearer <token>
```

Response khi đã có dữ liệu:

```json
{
  "success": true,
  "data": {
    "age": 22,
    "heightCm": 170,
    "weightKg": 62,
    "isComplete": true,
    "updatedAt": "2026-06-30T00:00:00.000Z"
  }
}
```

Response khi chưa đủ dữ liệu:

```json
{
  "success": true,
  "data": {
    "age": null,
    "heightCm": null,
    "weightKg": null,
    "isComplete": false,
    "updatedAt": null
  }
}
```

```http
PUT /api/users/me/body-profile
Authorization: Bearer <token>
Content-Type: application/json
```

Request:

```json
{
  "age": 22,
  "heightCm": 170,
  "weightKg": 62
}
```

Response:

```json
{
  "success": true,
  "message": "Đã lưu thông tin vóc dáng.",
  "data": {
    "age": 22,
    "heightCm": 170,
    "weightKg": 62,
    "isComplete": true,
    "updatedAt": "2026-06-30T00:00:00.000Z"
  }
}
```

Error response examples:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_BODY_PROFILE",
    "message": "Chiều cao phải nằm trong khoảng 100cm đến 230cm."
  }
}
```

## Database Scope For Body Profile

Ưu tiên thêm field vào `User` nếu schema hiện có đang lưu profile trực tiếp trong bảng user:

```prisma
model User {
  // existing fields
  age                  Int?
  heightCm             Decimal? @db.Decimal(5, 2)
  weightKg             Decimal? @db.Decimal(5, 2)
  bodyProfileUpdatedAt DateTime?
}
```

Nếu project đang tách profile riêng, tạo model mới:

```prisma
model UserBodyProfile {
  id        String   @id @default(uuid())
  userId    String   @unique
  age       Int
  heightCm  Decimal  @db.Decimal(5, 2)
  weightKg  Decimal  @db.Decimal(5, 2)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}
```

Chọn cách phù hợp nhất với schema hiện tại, nhưng API trả về phải ổn định theo contract ở trên.

---

# REPLICATE IDM-VTON INPUT

Model nhận input dạng:

```json
{
  "garm_img": "https://example.com/product-garment.png",
  "human_img": "https://example.com/user-photo.png",
  "garment_des": "Short Sleeve Round Neck T-shirt",
  "category": "upper_body",
  "crop": false,
  "force_dc": false,
  "mask_only": false,
  "steps": 30,
  "seed": 42
}
```

Mapping trong dự án:

- `garm_img`: ảnh chính của sản phẩm hoặc ảnh biến thể đã chọn.
- `human_img`: ảnh cá nhân user đã upload lên Cloudinary.
- `garment_des`: sinh từ product name, category, color, material, attributes.
- `category`: một trong `upper_body`, `lower_body`, `dresses`.
- `crop`: cho phép user bật/tắt; default `false`.
- `force_dc`: default `false`; có thể tự bật khi `category = dresses`.
- `mask_only`: luôn `false` ở production UI.
- `steps`: default `30`, min `1`, max `40`.
- `seed`: optional.

Nếu model trả về URL output, backend phải upload/copy output này về Cloudinary trước khi lưu vào database.

---

# FEATURE SCOPE

## User Features

Triển khai:

- Nút `Thử đồ bằng AI` trên trang chi tiết sản phẩm.
- Modal hoặc page thử đồ.
- Upload ảnh cá nhân.
- Preview ảnh cá nhân và ảnh sản phẩm.
- Chọn loại trang phục:
  - `upper_body`
  - `lower_body`
  - `dresses`
- Tự đề xuất category dựa trên category/product type hiện có nếu có thể.
- Advanced settings dạng collapsed:
  - `crop`
  - `steps`
  - `seed`
- Tạo ảnh try-on.
- Poll trạng thái.
- Hiển thị kết quả.
- Lưu lịch sử try-on của user.
- Xóa item khỏi lịch sử.

## Admin Features

Triển khai:

- API xem danh sách request try-on.
- API analytics:
  - total requests
  - success count
  - failed count
  - pending/processing count
  - average latency
  - estimated cost

Frontend admin chỉ cần triển khai nếu project đã có dashboard admin phù hợp; nếu chưa, hãy cung cấp API và docs.

---

# BACKEND IMPLEMENTATION

## Body Profile Module

Trước hoặc song song với VTON, triển khai phần body profile theo clean architecture hiện có. Có thể đặt trong module user/profile hiện tại nếu đã có, hoặc tạo module nhỏ:

```txt
server/src/module/user-profile/
  applications/
    dto/
      body-profile.dto.ts
    use-cases/
      get-my-body-profile.usecase.ts
      update-my-body-profile.usecase.ts
  infrastructure/
    repositories/
      prisma-body-profile.repository.ts
    api/
      body-profile.api.ts
  interface-adapter/
    controller/
      body-profile.controller.ts
  di.ts
```

Nếu project đã có module user, hãy mở rộng module đó thay vì tạo module trùng chức năng.

Yêu cầu backend:

- API phải yêu cầu authentication.
- Chỉ user hiện tại được đọc/ghi body profile của chính mình.
- Validate bằng DTO/schema validator theo convention hiện có.
- Lưu số decimal đúng kiểu, không lưu string.
- Trả `isComplete=true` chỉ khi đủ cả `age`, `heightCm`, `weightKg`.
- Recommendation API cần đọc body profile của user hiện tại và truyền vào ranking context nếu user đã có dữ liệu.

---

## Virtual Try-On Module

Tạo module mới:

```txt
server/src/module/virtual-try-on/
  applications/
    dto/
      virtual-try-on.dto.ts
    ports/
      input/
        virtual-try-on.usecase.ts
      output/
        virtual-try-on.repository.ts
        virtual-try-on-provider.ts
        virtual-try-on-storage.ts
    use-cases/
      create-virtual-try-on.usecase.ts
      get-virtual-try-on.usecase.ts
      list-my-virtual-try-ons.usecase.ts
      delete-my-virtual-try-on.usecase.ts
      refresh-virtual-try-on-status.usecase.ts
      get-virtual-try-on-analytics.usecase.ts
  domain/
    entities/
      virtual-try-on-request.entity.ts
    value-objects/
      virtual-try-on-status.ts
      virtual-try-on-category.ts
  infrastructure/
    api/
      virtual-try-on.api.ts
      admin-virtual-try-on.api.ts
    providers/
      ai-service-virtual-try-on.provider.ts
    repositories/
      prisma-virtual-try-on.repository.ts
    storage/
      cloudinary-virtual-try-on.storage.ts
    validators/
      virtual-try-on.validator.ts
  interface-adapter/
    controller/
      virtual-try-on.controller.ts
      admin-virtual-try-on.controller.ts
  di.ts
  index.ts
```

Hãy điều chỉnh structure theo pattern thật của repo nếu module hiện có dùng tên thư mục khác.

---

# BACKEND API CONTRACTS

## Create Try-On

```http
POST /api/virtual-try-on
Authorization: Bearer <token>
Content-Type: application/json
```

Request:

```json
{
  "productId": "product-id",
  "productImageUrl": "https://res.cloudinary.com/.../product.png",
  "humanImageUrl": "https://res.cloudinary.com/.../user.png",
  "category": "upper_body",
  "crop": false,
  "steps": 30,
  "seed": 42
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "try-on-id",
    "status": "PROCESSING",
    "productId": "product-id",
    "category": "upper_body",
    "createdAt": "2026-06-30T00:00:00.000Z"
  }
}
```

## Get Try-On

```http
GET /api/virtual-try-on/:id
Authorization: Bearer <token>
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "try-on-id",
    "status": "SUCCEEDED",
    "productId": "product-id",
    "humanImageUrl": "https://res.cloudinary.com/.../human.png",
    "productImageUrl": "https://res.cloudinary.com/.../product.png",
    "outputImageUrl": "https://res.cloudinary.com/.../result.png",
    "errorCode": null,
    "errorMessage": null,
    "createdAt": "2026-06-30T00:00:00.000Z",
    "completedAt": "2026-06-30T00:00:20.000Z"
  }
}
```

## History

```http
GET /api/virtual-try-on/history?page=1&limit=12
Authorization: Bearer <token>
```

## Delete

```http
DELETE /api/virtual-try-on/:id
Authorization: Bearer <token>
```

## Admin List

```http
GET /api/admin/virtual-try-on?status=FAILED&page=1&limit=20
Authorization: Bearer <admin-token>
```

## Admin Analytics

```http
GET /api/admin/virtual-try-on/analytics
Authorization: Bearer <admin-token>
```

---

# DATABASE REQUIREMENTS

Thêm Prisma model phù hợp vào schema hiện có:

```prisma
model VirtualTryOnRequest {
  id              String   @id @default(uuid())
  userId          String
  productId       String
  productImageUrl String
  humanImageUrl   String
  outputImageUrl  String?
  outputPublicId  String?
  provider        String   @default("replicate")
  modelName       String   @default("cuuupid/idm-vton")
  providerJobId   String?
  status          String
  category        String
  garmentDes      String
  crop            Boolean  @default(false)
  forceDc         Boolean  @default(false)
  maskOnly        Boolean  @default(false)
  steps           Int      @default(30)
  seed            Int?
  latencyMs       Int?
  estimatedCostUsd Decimal? @db.Decimal(10, 4)
  errorCode       String?
  errorMessage    String?
  startedAt       DateTime?
  completedAt     DateTime?
  deletedAt       DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([userId, createdAt])
  @@index([productId])
  @@index([status])
  @@index([providerJobId])
}
```

Nếu project dùng enum Prisma, tạo:

```prisma
enum VirtualTryOnStatus {
  PENDING
  PROCESSING
  SUCCEEDED
  FAILED
  CANCELED
  TIMEOUT
}
```

Nếu project đã có relation User/Product, hãy thêm relation đúng convention hiện có.

---

# AI SERVICE IMPLEMENTATION

Trong `ai-service`, tách code mới thay vì nhồi toàn bộ vào `main.py` nếu có thể:

```txt
ai-service/app/
  virtual_try_on/
    __init__.py
    schemas.py
    service.py
    replicate_provider.py
    routes.py
```

FastAPI endpoints:

## Create Prediction

```http
POST /virtual-try-on/predictions
```

Request:

```json
{
  "garm_img": "https://res.cloudinary.com/.../product.png",
  "human_img": "https://res.cloudinary.com/.../human.png",
  "garment_des": "Black cotton oversized t-shirt",
  "category": "upper_body",
  "crop": false,
  "force_dc": false,
  "mask_only": false,
  "steps": 30,
  "seed": 42
}
```

Response:

```json
{
  "prediction_id": "replicate-prediction-id",
  "status": "starting",
  "output": null,
  "error": null
}
```

## Get Prediction

```http
GET /virtual-try-on/predictions/{prediction_id}
```

Response:

```json
{
  "prediction_id": "replicate-prediction-id",
  "status": "succeeded",
  "output": "https://replicate.delivery/...",
  "error": null
}
```

AI service requirements:

- Dùng env `REPLICATE_API_TOKEN`.
- Dùng env `REPLICATE_IDM_VTON_MODEL=cuuupid/idm-vton`.
- Dùng HTTP client có timeout.
- Retry lỗi network tạm thời.
- Chuẩn hóa status Replicate sang status backend.
- Không log token.
- Không log full signed/private image URLs nếu không cần.
- Có health check vẫn chạy khi thiếu token, nhưng endpoint prediction phải trả lỗi cấu hình rõ ràng.

Có thể dùng Replicate Python SDK hoặc gọi HTTP API trực tiếp. Ưu tiên cách ít phá vỡ dependency hiện có nhất.

---

# FRONTEND IMPLEMENTATION

Trong `client-next`, triển khai UI phù hợp giao diện hiện có.

## Body Profile Modal

Tạo modal lấy thông tin cơ thể ở cấp toàn website:

```txt
client-next/components/profile/body-profile-modal.tsx
client-next/hooks/use-body-profile.ts
client-next/services/body-profile.service.ts
client-next/types/body-profile.types.ts
```

Gắn modal vào root layout/client provider phù hợp trong `client-next` để khi user đăng nhập và truy cập website thì tự kiểm tra profile.

Yêu cầu:

- Gọi `GET /api/users/me/body-profile` sau khi xác định user đã đăng nhập.
- Nếu `isComplete=false` và session hiện tại chưa dismiss, mở modal.
- Form gồm đúng 3 input:
  - Tuổi
  - Chiều cao (cm)
  - Cân nặng (kg)
- Validate realtime:
  - tuổi từ 13 đến 100
  - chiều cao từ 100 đến 230 cm
  - cân nặng từ 30 đến 250 kg
- Submit gọi `PUT /api/users/me/body-profile`.
- Sau khi lưu thành công, invalidate/refetch user profile/recommendation context nếu project đang cache bằng React Query/SWR.
- Button `Để sau` chỉ lưu `sessionStorage.setItem("bodyProfileModalDismissed", "true")`.
- Không hiện modal cho guest.
- Không hiện lại sau khi DB đã có đủ dữ liệu.
- Copywriting tiếng Việt, trung tính, không body-shaming.

---

## Virtual Try-On UI

Các file gợi ý:

```txt
client-next/components/page/product/virtual-try-on-button.tsx
client-next/components/page/product/virtual-try-on-modal.tsx
client-next/components/page/product/virtual-try-on-result.tsx
client-next/hooks/use-virtual-try-on.ts
client-next/services/virtual-try-on.service.ts
client-next/types/virtual-try-on.types.ts
```

Yêu cầu UX:

- Nút `Thử đồ bằng AI` xuất hiện trong product detail.
- Nếu chưa đăng nhập, điều hướng tới login hoặc hiển thị yêu cầu đăng nhập theo pattern hiện có.
- Modal không bị vỡ layout desktop/mobile.
- Upload ảnh có preview.
- Hiển thị ảnh sản phẩm đang thử.
- Có category selector.
- Có trạng thái:
  - idle
  - uploading
  - creating
  - processing
  - succeeded
  - failed
  - timeout
- Poll `GET /api/virtual-try-on/:id` mỗi 2-3 giây khi đang processing.
- Dừng poll khi `SUCCEEDED`, `FAILED`, `TIMEOUT`, `CANCELED`.
- Có button `Thử lại`.
- Có button tải/lưu ảnh nếu output thành công.
- Hiển thị lỗi thân thiện bằng tiếng Việt.

Không thêm text hướng dẫn dài dòng vào UI.

---

# IMAGE UPLOAD & CLOUDINARY

Yêu cầu:

- Upload ảnh user lên Cloudinary trước khi gọi create try-on.
- Nếu project đã có signed upload endpoint, tái sử dụng.
- Nếu chưa có endpoint phù hợp, thêm endpoint backend tạo Cloudinary signature cho virtual try-on.
- Validate:
  - MIME: `image/jpeg`, `image/png`, `image/webp`
  - size limit qua env `VIRTUAL_TRY_ON_MAX_IMAGE_MB=8`
- Output từ Replicate phải được lưu về Cloudinary:
  - folder gợi ý: `virtual-try-on/results`
  - lưu `outputImageUrl`
  - lưu `outputPublicId`

---

# VALIDATION & SECURITY

Bắt buộc:

- User chỉ được xem/xóa request của chính mình.
- Admin mới xem được toàn bộ request và analytics.
- Validate product tồn tại.
- Validate product có ảnh.
- Validate ảnh sản phẩm là URL hợp lệ.
- Validate `category` chỉ nhận:
  - `upper_body`
  - `lower_body`
  - `dresses`
- Validate `steps` từ `1` đến `40`.
- Validate `seed` là integer nếu có.
- Rate limit theo user:
  - Env `VIRTUAL_TRY_ON_RATE_LIMIT_PER_HOUR=5`
- Không gọi AI provider nếu rate limit vượt quá.
- Không expose raw provider error cho frontend.

Error codes:

```txt
PRODUCT_NOT_FOUND
PRODUCT_IMAGE_MISSING
INVALID_CATEGORY
INVALID_IMAGE_URL
INVALID_IMAGE_FORMAT
IMAGE_TOO_LARGE
TRY_ON_RATE_LIMITED
AI_SERVICE_UNAVAILABLE
AI_PROVIDER_NOT_CONFIGURED
AI_PROVIDER_TIMEOUT
AI_PROVIDER_FAILED
OUTPUT_UPLOAD_FAILED
UNAUTHORIZED
FORBIDDEN
```

---

# OBSERVABILITY

Backend logs:

- request id / correlation id
- user id
- product id
- try-on request id
- provider
- model name
- status
- latency ms
- error code

Metrics nếu project có Prometheus:

```txt
virtual_try_on_requests_total
virtual_try_on_success_total
virtual_try_on_failed_total
virtual_try_on_latency_ms
virtual_try_on_provider_errors_total
virtual_try_on_estimated_cost_usd_total
```

Cost env:

```env
VIRTUAL_TRY_ON_COST_PER_RUN_USD=0.025
```

---

# ENVIRONMENT VARIABLES

Cập nhật `.env.example`, docker compose và config loader nếu có:

```env
REPLICATE_API_TOKEN=
REPLICATE_IDM_VTON_MODEL=cuuupid/idm-vton
AI_SERVICE_URL=http://ai-service:8000
VIRTUAL_TRY_ON_COST_PER_RUN_USD=0.025
VIRTUAL_TRY_ON_RATE_LIMIT_PER_HOUR=5
VIRTUAL_TRY_ON_MAX_IMAGE_MB=8
VIRTUAL_TRY_ON_POLL_INTERVAL_MS=2500
VIRTUAL_TRY_ON_TIMEOUT_MS=120000
```

Không commit token thật.

---

# TEST REQUIREMENTS

Thêm test phù hợp với setup hiện có.

Backend:

- get body profile returns empty incomplete data
- update body profile success
- reject invalid age
- reject invalid height
- reject invalid weight
- body profile API requires auth
- recommendation request includes body profile context when available
- create try-on success
- product missing
- product image missing
- invalid category
- rate limited
- user cannot access another user's request
- provider failure maps to friendly error

AI service:

- create prediction request maps input đúng sang Replicate
- missing token returns configured error
- provider succeeded response normalized correctly
- provider failed response normalized correctly

Frontend:

- body profile modal renders for logged-in user without complete body profile
- body profile modal does not render for guest
- body profile form validates age/height/weight
- body profile submit stores data and closes modal
- `Để sau` hides modal for current session only
- render button in product detail
- modal upload preview
- submit disabled khi thiếu ảnh user
- success result renders output image
- failure state renders friendly Vietnamese error

Nếu project chưa có test setup cho frontend, ghi rõ trong final response và không tạo test framework mới quá lớn.

---

# IMPLEMENTATION ORDER

Làm theo thứ tự:

1. Đọc project structure và conventions.
2. Thêm database schema/migration cho body profile và VTON.
3. Thêm backend API body profile.
4. Thêm frontend body profile modal toàn website.
5. Đưa body profile vào recommendation context.
6. Thêm backend module virtual try-on.
7. Thêm AI service Replicate integration.
8. Thêm Cloudinary output storage.
9. Thêm frontend VTON modal/button/service/hooks.
10. Cập nhật env/docker docs.
11. Viết tests.
12. Chạy format/lint/test/build phù hợp.
13. Ghi lại hướng dẫn chạy và checklist.

---

# ACCEPTANCE CRITERIA

Feature chỉ được coi là xong khi:

- User đăng nhập và chưa có thông tin body profile sẽ thấy modal nhập tuổi, chiều cao, cân nặng khi vào website.
- Body profile được validate và lưu vào database.
- User đã lưu đủ body profile sẽ không thấy modal lặp lại.
- User bấm `Để sau` thì modal chỉ ẩn trong session hiện tại.
- Recommendation API có thể nhận/sử dụng body profile làm soft signal.
- User đăng nhập có thể tạo request thử đồ từ product detail.
- Backend tạo database record.
- Backend gọi AI service, AI service gọi Replicate.
- Hệ thống poll được trạng thái.
- Khi thành công, output được lưu về Cloudinary.
- Frontend hiển thị ảnh kết quả.
- User xem được lịch sử của chính mình.
- User không xem được request của user khác.
- Admin xem được analytics API.
- Có rate limit để kiểm soát chi phí.
- Có env example đầy đủ.
- Không hardcode token.
- Không pseudo-code.
- Không làm hỏng recommendation service hiện có trong `ai-service`.

---

# FINAL OUTPUT FORMAT

Khi hoàn thành, trả lời bằng tiếng Việt, gồm:

1. Tóm tắt các phần đã triển khai.
2. Danh sách file chính đã sửa/thêm.
3. Cách cấu hình env.
4. Cách chạy/test.
5. Các giới hạn còn lại, đặc biệt nhắc lại license `Non-commercial use only` của model Replicate.
