# Business Requirements Document (BRD) - Trang Chủ (Home Page)

## 1. Tổng quan (Overview)

Tài liệu này mô tả các yêu cầu nghiệp vụ và thông số kỹ thuật cho các API cần thiết để phục vụ hiển thị dữ liệu trên màn hình Trang Chủ (`page.tsx`) của ứng dụng eCommerce. Được thiết kế theo Clean Architecture, các API sẽ giao tiếp thông qua hệ sinh thái Node.js, Prisma, và có khả năng tích hợp Redis để tối ưu hóa hiệu năng (caching).

## 2. Phân tích Dữ liệu hiển thị (Data Display Analysis)

Dựa trên source code frontend (`page.tsx`), trang chủ đang hiển thị và yêu cầu các luồng dữ liệu sau:

1. **Header & User State**:
   - Trạng thái đăng nhập (`isAuthenticated`).
   - Tóm tắt giỏ hàng (`cartCount` - tổng số sản phẩm trong giỏ).
2. **Danh mục sản phẩm nổi bật (Featured Categories)**:
   - Danh sách các danh mục (tối đa 4 danh mục nổi bật).
   - Thông tin hiển thị: Tên danh mục, Hình ảnh đại diện, Tổng số lượng sản phẩm trong danh mục (`productCount`).
3. **Sản phẩm mới nhất (Latest Drop / New Arrivals)**:
   - Danh sách sản phẩm (tối đa 12 sản phẩm).
   - Thông tin hiển thị: Tên sản phẩm, Hình ảnh, Giá thấp nhất (`minPrice`), Nhãn ưu đãi (New/Sale).
4. **Sản phẩm theo danh mục (Category Spotlight)**:
   - Nhóm các sản phẩm theo danh mục tương ứng.
   - Frontend hiện đang gọi API Product Detail cho 12 sản phẩm đầu tiên để bóc tách thông tin danh mục, sau đó nhóm lại. _(Lưu ý: Logic này ở frontend không tối ưu, cần thiết kế API backend trả về trực tiếp cấu trúc nhóm này)._

## 3. Danh sách API Cần thiết (API Specifications)

### 3.1. API Lấy danh sách danh mục (Get Categories) (Đã có)

- **Endpoint**: `GET /api/v1/categories` (hoặc tương tự)
- **Mục đích**: Lấy danh sách danh mục hiển thị trên top categories.
- **Response Data (Expected)**:
  ```json
  [
    {
      "id": "uuid",
      "name": "Áo Thun",
      "slug": "ao-thun",
      "imageUrl": "https://...",
      "productCount": 150
    }
  ]
  ```
- **Technical Note**: Cần có cache (Redis) vì dữ liệu này ít thay đổi. Query DB cần left join hoặc count aggregation bảng `Product` để ra `productCount`.

### 3.2. API Lấy danh sách sản phẩm (Get Products / New Arrivals)

- **Endpoint**: `GET /api/v1/products`
- **Query Params**: `?sort=createdAt:desc&limit=12`
- **Mục đích**: Lấy danh sách sản phẩm mới nhất hoặc hiển thị chung.
- **Response Data (Expected)**:
  ```json
  {
    "products": [
      {
        "id": "uuid",
        "name": "Áo Thun Basic",
        "imageUrl": "https://...",
        "minPrice": "250000"
      }
    ],
    "total": 100
  }
  ```

### 3.3. API Lấy nhóm sản phẩm theo danh mục (Get Category Showcases) [Đề xuất mới]

- **Endpoint**: `GET /api/products/home/category-showcases`
- **Query Params**: `?categoryLimit=4&productLimit=3`
- **Mục đích**: Thay vì để Frontend phải gọi nhiều API Get Details để tự gom nhóm (N+1 query issue ở frontend), backend nên cung cấp 1 API trả về cấu trúc sẵn có cho Category Spotlight.
- **Response Data (Expected)**:
  ```json
  [
    {
      "id": "cat-uuid",
      "name": "Áo Khoác",
      "slug": "ao-khoac",
      "imageUrl": "https://...",
      "products": [{ "id": "prod-1", "name": "Jacket", "minPrice": "500000", "imageUrl": "..." }]
    }
  ]
  ```

### 3.4. API Lấy tóm tắt giỏ hàng (Get Cart Summary)

- **Endpoint**: `GET /api/v1/cart/summary`
- **Authorization**: `Bearer Token` (Chỉ gọi khi `isAuthenticated = true`)
- **Mục đích**: Lấy tổng số lượng items để hiển thị trên Header (Cart badge).
- **Response Data (Expected)**:
  ```json
  {
    "totalItems": 3,
    "totalPrice": "750000"
  }
  ```

## 4. Các vấn đề nghiệp vụ cần làm rõ (Business Questions)

1. **Logic gán nhãn "Sale" / "New"**: Ở frontend đang hardcode logic `idx % 3 === 0 ? "Sale" : "New"`. Backend có cần lưu ý quản lý cờ (flags) này vào Database (field `isSale`, `isNew` trên `Product`) và trả về qua API không?
   => có
2. **Logic Lọc Fashion Product**: Frontend đang dùng một mảng hardcode `NON_FASHION_KEYWORDS` để loại bỏ đồ điện tử. Chúng ta có nên đưa phân loại (Fashion vs Non-Fashion) thành 1 field `type` trong Category/Product ở backend để API filter chuẩn xác hơn không?
   => Không cần, 100% sản phẩm trên shop là đồ thời trang
3. **Hiệu năng trang chủ**: Trang chủ có traffic lớn nhất, data (Categories, New Arrivals) có cho phép delay do Caching (Redis) khoảng 5-15 phút không để tối ưu truy vấn database?
   => Nên tối ưu

## 5. Kế hoạch triển khai (Implementation Plan)

### Sprint / Phase 1: Thống nhất requirement và Thiết kế DB

- Rà soát lại Prisma Schema cho `Product`, `Category`, `Cart`.
- Chốt cấu trúc Response Payload với các team liên quan (Frontend/Mobile).
- Mở rộng Schema nếu cần (ví dụ: thêm field `isPromotion`).
- Một số API đã có sẵn, hãy tận dụng lại nó

### Phase 2: Phát triển Backend API (Development)

- Dựng DTO (Data Transfer Object) tương ứng trong Node.js.
- Cấu hình Prisma query (Lưu ý performance khi count products).
- Triển khai API lấy Carousel/Showcase ở Backend để thay thế logic gộp của Frontend hiện hành.
- Gắn Redis Cache vào các API Get List ở trang chủ.

### Phase 3: Testing & Tích hợp

- Viết Unit Test (Jest) cho các Services xử lý logic (ví dụ: logic lấy Top Categories).
- Phối hợp Frontend đổi lại endpoint (đặc biệt endpoint thay thế cho multiple API check detail của showcase).
- Load test (JMeter/K6) trang chủ để đảm bảo Cache hit rate ổn định.
