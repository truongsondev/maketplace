# Mô tả các bảng trong schema.prisma

Tài liệu này được sinh từ `server/prisma/schema.prisma`. Mỗi bảng bên dưới mô tả các cột dữ liệu chính theo cấu trúc: STT, Tên thuộc tính, Kiểu dữ liệu, Mô tả. Các field quan hệ Prisma dạng object/list được lược bỏ, nhưng các khóa ngoại dạng scalar vẫn được giữ lại.

## Bảng chính, quan trọng và không thể thiếu

**Tổng số bảng chính:** 30 bảng.

> Gợi ý khi đưa vào Word: dùng font Times New Roman hoặc Arial, cỡ chữ 13-14, tiêu đề cỡ 16-18, bật căn giữa cho hàng tiêu đề và chọn AutoFit to Window để bảng dễ đọc.

| STT | Nhóm nghiệp vụ | Model Prisma | Tên bảng trong DB | Vai trò chính |
|---:|---|---|---|---|
| 1 | Người dùng và phân quyền | `User` | `users` | Lưu tài khoản người dùng, thông tin đăng nhập và trạng thái tài khoản. |
| 2 | Người dùng và phân quyền | `RefreshToken` | `refresh_tokens` | Quản lý phiên đăng nhập và làm mới token. |
| 3 | Người dùng và phân quyền | `Role` | `roles` | Định nghĩa vai trò như khách hàng, quản trị viên. |
| 4 | Người dùng và phân quyền | `UserRole` | `user_roles` | Gán vai trò cho từng người dùng. |
| 5 | Người dùng và phân quyền | `UserAddress` | `user_addresses` | Lưu địa chỉ nhận hàng của người dùng. |
| 6 | Sản phẩm và danh mục | `Product` | `products` | Lưu thông tin chính của sản phẩm. |
| 7 | Sản phẩm và danh mục | `ProductVariant` | `product_variants` | Quản lý biến thể sản phẩm, SKU, giá và tồn kho. |
| 8 | Sản phẩm và danh mục | `ProductImage` | `product_images` | Lưu ảnh sản phẩm và ảnh theo biến thể. |
| 9 | Sản phẩm và danh mục | `Category` | `categories` | Quản lý danh mục sản phẩm. |
| 10 | Sản phẩm và danh mục | `ProductCategory` | `product_categories` | Liên kết sản phẩm với danh mục. |
| 11 | Thuộc tính sản phẩm | `ProductType` | `product_types` | Xác định loại sản phẩm và bộ thuộc tính phù hợp. |
| 12 | Thuộc tính sản phẩm | `AttributeDefinition` | `attribute_definitions` | Định nghĩa thuộc tính như màu sắc, kích cỡ, chất liệu. |
| 13 | Thuộc tính sản phẩm | `AttributeOption` | `attribute_options` | Lưu các lựa chọn của thuộc tính dạng chọn. |
| 14 | Thuộc tính sản phẩm | `ProductTypeAttribute` | `product_type_attributes` | Gắn thuộc tính vào từng loại sản phẩm. |
| 15 | Thuộc tính sản phẩm | `ProductAttributeValue` | `product_attribute_values` | Lưu giá trị thuộc tính ở cấp sản phẩm. |
| 16 | Thuộc tính sản phẩm | `ProductAttributeValueOption` | `product_attribute_value_options` | Lưu lựa chọn thuộc tính nhiều giá trị của sản phẩm. |
| 17 | Thuộc tính sản phẩm | `VariantAttributeValue` | `variant_attribute_values` | Lưu giá trị thuộc tính ở cấp biến thể. |
| 18 | Giỏ hàng | `Cart` | `carts` | Lưu giỏ hàng của người dùng. |
| 19 | Giỏ hàng | `CartItem` | `cart_items` | Lưu từng sản phẩm trong giỏ hàng. |
| 20 | Đơn hàng và thanh toán | `Order` | `orders` | Lưu thông tin đơn hàng. |
| 21 | Đơn hàng và thanh toán | `OrderItem` | `order_items` | Lưu từng sản phẩm trong đơn hàng. |
| 22 | Đơn hàng và thanh toán | `Payment` | `payments` | Lưu trạng thái và phương thức thanh toán của đơn hàng. |
| 23 | Đơn hàng và thanh toán | `PaymentTransaction` | `payment_transactions` | Lưu giao dịch thanh toán từ cổng thanh toán. |
| 24 | Đơn hàng và thanh toán | `OrderStatusHistory` | `order_status_history` | Lưu lịch sử thay đổi trạng thái đơn hàng. |
| 25 | Khuyến mãi | `Discount` | `discounts` | Lưu mã giảm giá, điều kiện áp dụng và thời gian hiệu lực. |
| 26 | Khuyến mãi | `DiscountUsage` | `discount_usages` | Ghi nhận lượt sử dụng mã giảm giá. |
| 27 | Tồn kho và hậu mãi | `InventoryLog` | `inventory_logs` | Ghi nhận lịch sử nhập, xuất và điều chỉnh tồn kho. |
| 28 | Tồn kho và hậu mãi | `Return` | `returns` | Quản lý yêu cầu trả hàng. |
| 29 | Tồn kho và hậu mãi | `RefundTransaction` | `refund_transactions` | Lưu giao dịch hoàn tiền. |
| 30 | Tồn kho và hậu mãi | `OrderCancelRequest` | `order_cancel_requests` | Quản lý yêu cầu hủy đơn hàng đã đặt. |

## Danh sách enum

- `UserStatus`: `ACTIVE`, `SUSPENDED`, `BANNED`.
- `OAuthProvider`: `GOOGLE`, `FACEBOOK`, `APPLE`.
- `OrderStatus`: `PENDING`, `CONFIRMED`, `PAID`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `RETURNED`.
- `PaymentStatus`: `PENDING`, `PAID`, `SUCCESS`, `FAILED`, `EXPIRED`, `REFUNDED`.
- `PaymentTransactionStatus`: `PENDING`, `PAID`, `FAILED`, `EXPIRED`.
- `InventoryAction`: `IMPORT`, `EXPORT`, `RETURN`, `ADJUSTMENT`.
- `ActorType`: `ADMIN`, `USER`, `SYSTEM`.
- `ReturnStatus`: `RT_REQUESTED`, `RT_APPROVED`, `RT_SHIPPING`, `RT_COMPLETED`, `RT_REJECTED`.
- `ReturnFlowStatus`: `REQUESTED`, `APPROVED`, `SHIPPING`, `COMPLETED`, `REJECTED`.
- `RefundType`: `CANCEL_REFUND`, `RETURN_REFUND`.
- `RefundStatus`: `PENDING`, `SUCCESS`, `FAILED`, `RETRYING`.
- `CancelReason`: `NO_LONGER_NEEDED`, `BUY_OTHER_ITEM`, `FOUND_CHEAPER`, `OTHER`.
- `CancelRequestStatus`: `REQUESTED`, `APPROVED`, `REJECTED`, `COMPLETED`.
- `DiscountType`: `PERCENTAGE`, `FIXED_AMOUNT`.
- `ProductStatus`: `DRAFT`, `ACTIVE`, `ARCHIVED`.
- `VariantStatus`: `ACTIVE`, `INACTIVE`.
- `AttributeScope`: `PRODUCT`, `VARIANT`.
- `AttributeDataType`: `TEXT`, `NUMBER`, `BOOLEAN`, `DATE`, `SELECT`, `MULTI_SELECT`.
- `RecommendationEventType`: `VIEW_PRODUCT`, `ADD_TO_CART`, `REMOVE_FROM_CART`, `PURCHASE`, `SEARCH_QUERY`, `FAVORITE_PRODUCT`.
- `RecommendationModelKind`: `TRENDING`, `TOP_VIEWED`, `TOP_PURCHASED`, `ITEM_SIMILARITY`, `PERSONALIZED`, `HYBRID`, `SESSION_BASED`.
- `ChatMessageRole`: `USER`, `ASSISTANT`, `SYSTEM`.
- `ChatSessionStatus`: `OPEN`, `QUALIFIED`, `CONTACT_CAPTURED`, `ESCALATED`, `CLOSED`.

## User (`users`)

Bảng người dùng gốc - lưu thông tin xác thực cốt lõi

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `email` | VarChar(255) (nullable) | Email của người dùng hoặc khách hàng tiềm năng; giá trị duy nhất; có thể để trống. |
| 3 | `phone` | VarChar(20) (nullable) | Số điện thoại liên hệ; giá trị duy nhất; có thể để trống. |
| 4 | `passwordHash` | VarChar(255) (nullable) | Mật khẩu đã được băm, không lưu mật khẩu thô; tên cột DB `password_hash`; có thể để trống. |
| 5 | `emailVerified` | Boolean | Cờ cho biết email đã được xác thực hay chưa; mặc định `false`; tên cột DB `email_verified`. |
| 6 | `status` | Enum `UserStatus` | Trạng thái hiện tại của bản ghi; mặc định `ACTIVE`. |
| 7 | `lastLogin` | DateTime (nullable) | Thời điểm đăng nhập gần nhất; tên cột DB `last_login`; có thể để trống. |
| 8 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |
| 9 | `updatedAt` | DateTime | Thời điểm cập nhật bản ghi gần nhất; tự động cập nhật khi bản ghi thay đổi; tên cột DB `updated_at`. |

## RefreshToken (`refresh_tokens`)

Quản lý phiên đăng nhập với JWT

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `userId` | VarChar(36) | Định danh người dùng liên quan; tên cột DB `user_id`. |
| 3 | `token` | VarChar(500) | Token dùng cho xác thực hoặc duy trì phiên; giá trị duy nhất. |
| 4 | `deviceInfo` | VarChar(500) (nullable) | Lưu thông tin device info của bản ghi; tên cột DB `device_info`; có thể để trống. |
| 5 | `expiresAt` | DateTime | Thời điểm hết hạn; tên cột DB `expires_at`. |
| 6 | `revoked` | Boolean | Cờ cho biết token đã bị thu hồi hay chưa; mặc định `false`. |
| 7 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |

## EmailVerificationToken (`email_verification_tokens`)

Email verification tokens for registration flow

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `userId` | VarChar(36) | Định danh người dùng liên quan; tên cột DB `user_id`. |
| 3 | `tokenHash` | VarChar(64) | Giá trị băm của token để lưu trữ an toàn; giá trị duy nhất; tên cột DB `token_hash`. |
| 4 | `expiresAt` | DateTime | Thời điểm hết hạn; tên cột DB `expires_at`. |
| 5 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |

## PasswordResetToken (`password_reset_tokens`)

Password reset tokens for forgot-password flow

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `userId` | VarChar(36) | Định danh người dùng liên quan; tên cột DB `user_id`. |
| 3 | `tokenHash` | VarChar(64) | Giá trị băm của token để lưu trữ an toàn; giá trị duy nhất; tên cột DB `token_hash`. |
| 4 | `expiresAt` | DateTime | Thời điểm hết hạn; tên cột DB `expires_at`. |
| 5 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |

## OAuthAccount (`oauth_accounts`)

Liên kết đăng nhập OAuth (Google, Facebook, Apple)

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `userId` | VarChar(36) | Định danh người dùng liên quan; tên cột DB `user_id`. |
| 3 | `provider` | Enum `OAuthProvider` | Nhà cung cấp dịch vụ/tích hợp bên ngoài. |
| 4 | `providerUserId` | VarChar(500) | Định danh người dùng tại nhà cung cấp OAuth; tên cột DB `provider_user_id`. |
| 5 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |

## Role (`roles`)

Định nghĩa các vai trò trong hệ thống

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | Int | Định danh duy nhất của bản ghi; khóa chính; tự động tăng. |
| 2 | `code` | VarChar(50) | BUYER, SELLER, ADMIN; giá trị duy nhất. |
| 3 | `name` | VarChar(100) | Tên hiển thị của bản ghi. |
| 4 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |

## UserRole (`user_roles`)

Bảng trung gian - gán vai trò cho user (n-n)

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `userId` | VarChar(36) | Định danh người dùng liên quan; tên cột DB `user_id`. |
| 2 | `roleId` | Int | Định danh vai trò liên quan; tên cột DB `role_id`. |

## UserAddress (`user_addresses`)

Địa chỉ người dùng - quản lý nhiều địa chỉ giao hàng

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `userId` | VarChar(36) | Định danh người dùng liên quan; tên cột DB `user_id`. |
| 3 | `recipient` | VarChar(255) | Tên người nhận hàng. |
| 4 | `phone` | VarChar(20) | Số điện thoại liên hệ. |
| 5 | `addressLine` | Text | Địa chỉ chi tiết; tên cột DB `address_line`. |
| 6 | `ward` | VarChar(100) | Phường/xã. |
| 7 | `district` | VarChar(100) | Quận/huyện. |
| 8 | `city` | VarChar(100) | Tỉnh/thành phố. |
| 9 | `isDefault` | Boolean | Cờ cho biết đây là lựa chọn mặc định; mặc định `false`; tên cột DB `is_default`. |
| 10 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |

## Product (`products`)

Sản phẩm - thông tin cơ bản; tồn kho & giá thực tế nằm ở ProductVariant

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `productTypeId` | VarChar(36) (nullable) | Loại sản phẩm (áo/quần/phụ kiện...). Nullable để migrate dần; tên cột DB `product_type_id`; có thể để trống. |
| 3 | `name` | VarChar(255) | Tên hiển thị của bản ghi. |
| 4 | `description` | Text (nullable) | Mô tả chi tiết; có thể để trống. |
| 5 | `basePrice` | Decimal(10, 2) | Giá hiển thị / khởi điểm; giá bán thực tế lấy từ ProductVariant.price; tên cột DB `base_price`. |
| 6 | `status` | Enum `ProductStatus` | Trạng thái catalog (đi đường dài). Migrate dần, mặc định ACTIVE; mặc định `ACTIVE`. |
| 7 | `isSale` | Boolean | Lưu thông tin is sale của bản ghi; mặc định `false`; tên cột DB `is_sale`. |
| 8 | `isDeleted` | Boolean | Cờ đánh dấu bản ghi đã bị xóa mềm; mặc định `false`; tên cột DB `is_deleted`. |
| 9 | `deletedAt` | DateTime (nullable) | Soft-delete chuẩn (nullable để migrate dần); tên cột DB `deleted_at`; có thể để trống. |
| 10 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |
| 11 | `updatedAt` | DateTime | Thời điểm cập nhật bản ghi gần nhất; tự động cập nhật khi bản ghi thay đổi; tên cột DB `updated_at`. |

## ProductVariant (`product_variants`)

Biến thể sản phẩm - quản lý SKU, size/màu, tồn kho

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `productId` | VarChar(36) | Định danh sản phẩm liên quan; tên cột DB `product_id`. |
| 3 | `sku` | VarChar(100) | Mã SKU của biến thể sản phẩm; giá trị duy nhất. |
| 4 | `optionKey` | VarChar(500) (nullable) | Canonical key cho tổ hợp biến thể (vd: color=red|size=m). Nullable để backfill dần; tên cột DB `option_key`; có thể để trống. |
| 5 | `status` | Enum `VariantStatus` | Trạng thái hiện tại của bản ghi; mặc định `ACTIVE`. |
| 6 | `isDefault` | Boolean | Cờ cho biết đây là lựa chọn mặc định; mặc định `false`; tên cột DB `is_default`. |
| 7 | `attributes` | Json | Thuộc tính biến thể: {"color": "đỏ", "size": "M"}; mặc định `"{}"`. |
| 8 | `price` | Decimal(10, 2) | Giá bán của sản phẩm hoặc biến thể. |
| 9 | `stockAvailable` | Int | Số lượng tồn kho có thể bán; mặc định `0`; tên cột DB `stock_available`. |
| 10 | `stockOnHand` | Int | Chuẩn dài hạn: stockOnHand (giữ song song để migrate); mặc định `0`; tên cột DB `stock_on_hand`. |
| 11 | `stockReserved` | Int | Số lượng tồn kho đã được giữ chỗ; mặc định `0`; tên cột DB `stock_reserved`. |
| 12 | `minStock` | Int | Ngưỡng tồn kho tối thiểu để cảnh báo; mặc định `5`; tên cột DB `min_stock`. |
| 13 | `isDeleted` | Boolean | Cờ đánh dấu bản ghi đã bị xóa mềm; mặc định `false`; tên cột DB `is_deleted`. |
| 14 | `deletedAt` | DateTime (nullable) | Thời điểm xóa mềm bản ghi; rỗng nếu bản ghi còn hiệu lực; tên cột DB `deleted_at`; có thể để trống. |
| 15 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |
| 16 | `updatedAt` | DateTime | Thời điểm cập nhật bản ghi gần nhất; tự động cập nhật khi bản ghi thay đổi; tên cột DB `updated_at`. |

## ProductImage (`product_images`)

Ảnh sản phẩm - ảnh chung hoặc riêng cho từng variant

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `productId` | VarChar(36) | Định danh sản phẩm liên quan; tên cột DB `product_id`. |
| 3 | `variantId` | VarChar(36) (nullable) | Định danh biến thể sản phẩm liên quan; tên cột DB `variant_id`; có thể để trống. |
| 4 | `url` | VarChar(1000) | Đường dẫn tài nguyên hoặc hình ảnh. |
| 5 | `altText` | VarChar(255) (nullable) | Văn bản thay thế cho hình ảnh; tên cột DB `alt_text`; có thể để trống. |
| 6 | `sortOrder` | Int | Thứ tự sắp xếp khi hiển thị; mặc định `0`; tên cột DB `sort_order`. |
| 7 | `isPrimary` | Boolean | Cờ cho biết bản ghi chính/ưu tiên; mặc định `false`; tên cột DB `is_primary`. |
| 8 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |

## Category (`categories`)

CATEGORIES & TAGS

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `name` | VarChar(255) | Tên hiển thị của bản ghi. |
| 3 | `slug` | VarChar(255) | Chuỗi định danh thân thiện URL; giá trị duy nhất. |
| 4 | `description` | Text (nullable) | Mô tả chi tiết; có thể để trống. |
| 5 | `imageUrl` | VarChar(1000) (nullable) | Đường dẫn hình ảnh; tên cột DB `image_url`; có thể để trống. |
| 6 | `sortOrder` | Int | Thứ tự sắp xếp khi hiển thị; mặc định `0`; tên cột DB `sort_order`. |
| 7 | `parentId` | VarChar(36) (nullable) | Định danh bản ghi cha trong cấu trúc phân cấp; tên cột DB `parent_id`; có thể để trống. |
| 8 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |
| 9 | `updatedAt` | DateTime | Thời điểm cập nhật bản ghi gần nhất; tự động cập nhật khi bản ghi thay đổi; tên cột DB `updated_at`. |
| 10 | `deletedAt` | DateTime (nullable) | Thời điểm xóa mềm bản ghi; rỗng nếu bản ghi còn hiệu lực; tên cột DB `deleted_at`; có thể để trống. |

## ProductCategory (`product_categories`)

Bảng trung gian - sản phẩm thuộc nhiều danh mục

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `productId` | VarChar(36) | Định danh sản phẩm liên quan; tên cột DB `product_id`. |
| 2 | `categoryId` | VarChar(36) | Định danh danh mục liên quan; tên cột DB `category_id`. |
| 3 | `isPrimary` | Boolean | Merchandising; mặc định `false`; tên cột DB `is_primary`. |
| 4 | `sortOrder` | Int | Thứ tự sắp xếp khi hiển thị; mặc định `0`; tên cột DB `sort_order`. |

## ProductType (`product_types`)

PRODUCT TYPE

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `code` | VarChar(100) | Mã định danh nghiệp vụ, thường dùng để tra cứu nhanh; giá trị duy nhất. |
| 3 | `name` | VarChar(255) | Tên hiển thị của bản ghi. |
| 4 | `description` | Text (nullable) | Mô tả chi tiết; có thể để trống. |
| 5 | `deletedAt` | DateTime (nullable) | Thời điểm xóa mềm bản ghi; rỗng nếu bản ghi còn hiệu lực; tên cột DB `deleted_at`; có thể để trống. |
| 6 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |
| 7 | `updatedAt` | DateTime | Thời điểm cập nhật bản ghi gần nhất; tự động cập nhật khi bản ghi thay đổi; tên cột DB `updated_at`. |

## AttributeDefinition (`attribute_definitions`)

ATTRIBUTE DEFINITIONS

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `code` | VarChar(100) | Mã định danh nghiệp vụ, thường dùng để tra cứu nhanh; giá trị duy nhất. |
| 3 | `name` | VarChar(255) | Tên hiển thị của bản ghi. |
| 4 | `scope` | Enum `AttributeScope` | Phạm vi áp dụng của thuộc tính. |
| 5 | `dataType` | Enum `AttributeDataType` | Kiểu dữ liệu của thuộc tính; tên cột DB `data_type`. |
| 6 | `unit` | VarChar(50) (nullable) | Đơn vị đo của thuộc tính; có thể để trống. |
| 7 | `deletedAt` | DateTime (nullable) | Thời điểm xóa mềm bản ghi; rỗng nếu bản ghi còn hiệu lực; tên cột DB `deleted_at`; có thể để trống. |
| 8 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |
| 9 | `updatedAt` | DateTime | Thời điểm cập nhật bản ghi gần nhất; tự động cập nhật khi bản ghi thay đổi; tên cột DB `updated_at`. |

## AttributeOption (`attribute_options`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `attributeId` | VarChar(36) | Định danh thuộc tính liên quan; tên cột DB `attribute_id`. |
| 3 | `value` | VarChar(100) | Giá trị nghiệp vụ. |
| 4 | `label` | VarChar(255) | Nhãn hiển thị cho người dùng. |
| 5 | `sortOrder` | Int | Thứ tự sắp xếp khi hiển thị; mặc định `0`; tên cột DB `sort_order`. |
| 6 | `swatchHex` | VarChar(16) (nullable) | Mã màu HEX dùng để hiển thị swatch màu; tên cột DB `swatch_hex`; có thể để trống. |
| 7 | `deletedAt` | DateTime (nullable) | Thời điểm xóa mềm bản ghi; rỗng nếu bản ghi còn hiệu lực; tên cột DB `deleted_at`; có thể để trống. |
| 8 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |
| 9 | `updatedAt` | DateTime | Thời điểm cập nhật bản ghi gần nhất; tự động cập nhật khi bản ghi thay đổi; tên cột DB `updated_at`. |

## ProductTypeAttribute (`product_type_attributes`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `productTypeId` | VarChar(36) | Định danh loại sản phẩm liên quan; tên cột DB `product_type_id`. |
| 2 | `attributeId` | VarChar(36) | Định danh thuộc tính liên quan; tên cột DB `attribute_id`. |
| 3 | `isRequired` | Boolean | Cờ cho biết thuộc tính bắt buộc; mặc định `false`; tên cột DB `is_required`. |
| 4 | `isFilterable` | Boolean | Cờ cho biết thuộc tính có thể dùng để lọc; mặc định `false`; tên cột DB `is_filterable`. |
| 5 | `isVariantAxis` | Boolean | Cờ cho biết thuộc tính là trục tạo biến thể; mặc định `false`; tên cột DB `is_variant_axis`. |
| 6 | `variantAxisOrder` | Int (nullable) | Thứ tự của trục biến thể; tên cột DB `variant_axis_order`; có thể để trống. |
| 7 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |
| 8 | `updatedAt` | DateTime | Thời điểm cập nhật bản ghi gần nhất; tự động cập nhật khi bản ghi thay đổi; tên cột DB `updated_at`. |

## ProductAttributeValue (`product_attribute_values`)

ATTRIBUTE VALUES (PRODUCT)

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `productId` | VarChar(36) | Định danh sản phẩm liên quan; tên cột DB `product_id`. |
| 3 | `attributeId` | VarChar(36) | Định danh thuộc tính liên quan; tên cột DB `attribute_id`. |
| 4 | `textValue` | Text (nullable) | Giá trị thuộc tính dạng văn bản; tên cột DB `text_value`; có thể để trống. |
| 5 | `numberValue` | Decimal(18, 4) (nullable) | Giá trị thuộc tính dạng số; tên cột DB `number_value`; có thể để trống. |
| 6 | `booleanValue` | Boolean (nullable) | Giá trị thuộc tính dạng đúng/sai; tên cột DB `boolean_value`; có thể để trống. |
| 7 | `dateValue` | DateTime (nullable) | Giá trị thuộc tính dạng ngày giờ; tên cột DB `date_value`; có thể để trống. |
| 8 | `optionId` | VarChar(36) (nullable) | Định danh tùy chọn thuộc tính liên quan; tên cột DB `option_id`; có thể để trống. |
| 9 | `deletedAt` | DateTime (nullable) | Thời điểm xóa mềm bản ghi; rỗng nếu bản ghi còn hiệu lực; tên cột DB `deleted_at`; có thể để trống. |
| 10 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |
| 11 | `updatedAt` | DateTime | Thời điểm cập nhật bản ghi gần nhất; tự động cập nhật khi bản ghi thay đổi; tên cột DB `updated_at`. |

## ProductAttributeValueOption (`product_attribute_value_options`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `productAttributeValueId` | VarChar(36) | Lưu thông tin product attribute value id của bản ghi; tên cột DB `product_attribute_value_id`. |
| 2 | `optionId` | VarChar(36) | Định danh tùy chọn thuộc tính liên quan; tên cột DB `option_id`. |

## VariantAttributeValue (`variant_attribute_values`)

ATTRIBUTE VALUES (VARIANT)

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `variantId` | VarChar(36) | Định danh biến thể sản phẩm liên quan; tên cột DB `variant_id`. |
| 3 | `attributeId` | VarChar(36) | Định danh thuộc tính liên quan; tên cột DB `attribute_id`. |
| 4 | `textValue` | Text (nullable) | Giá trị thuộc tính dạng văn bản; tên cột DB `text_value`; có thể để trống. |
| 5 | `numberValue` | Decimal(18, 4) (nullable) | Giá trị thuộc tính dạng số; tên cột DB `number_value`; có thể để trống. |
| 6 | `booleanValue` | Boolean (nullable) | Giá trị thuộc tính dạng đúng/sai; tên cột DB `boolean_value`; có thể để trống. |
| 7 | `dateValue` | DateTime (nullable) | Giá trị thuộc tính dạng ngày giờ; tên cột DB `date_value`; có thể để trống. |
| 8 | `optionId` | VarChar(36) (nullable) | Định danh tùy chọn thuộc tính liên quan; tên cột DB `option_id`; có thể để trống. |
| 9 | `deletedAt` | DateTime (nullable) | Thời điểm xóa mềm bản ghi; rỗng nếu bản ghi còn hiệu lực; tên cột DB `deleted_at`; có thể để trống. |
| 10 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |
| 11 | `updatedAt` | DateTime | Thời điểm cập nhật bản ghi gần nhất; tự động cập nhật khi bản ghi thay đổi; tên cột DB `updated_at`. |

## Tag (`tags`)

Tag - nhãn tự do gắn vào sản phẩm

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `name` | VarChar(100) | Tên hiển thị của bản ghi; giá trị duy nhất. |
| 3 | `slug` | VarChar(100) | Chuỗi định danh thân thiện URL; giá trị duy nhất. |

## ProductTag (`product_tags`)

Bảng trung gian - sản phẩm gắn nhiều tag

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `productId` | VarChar(36) | Định danh sản phẩm liên quan; tên cột DB `product_id`. |
| 2 | `tagId` | VarChar(36) | Lưu thông tin tag id của bản ghi; tên cột DB `tag_id`. |

## Cart (`carts`)

CART Giỏ hàng - mỗi user có 1 giỏ hàng

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `userId` | VarChar(36) | Định danh người dùng liên quan; giá trị duy nhất; tên cột DB `user_id`. |
| 3 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |

## CartItem (`cart_items`)

Chi tiết giỏ hàng

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `cartId` | VarChar(36) | Lưu thông tin cart id của bản ghi; tên cột DB `cart_id`. |
| 3 | `productId` | VarChar(36) | Định danh sản phẩm liên quan; tên cột DB `product_id`. |
| 4 | `variantId` | VarChar(36) (nullable) | Định danh biến thể sản phẩm liên quan; tên cột DB `variant_id`; có thể để trống. |
| 5 | `quantity` | Int | Số lượng. |

## Order (`orders`)

ORDERS Đơn hàng

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `userId` | VarChar(36) | Định danh người dùng liên quan; tên cột DB `user_id`. |
| 3 | `totalPrice` | Decimal(10, 2) | Lưu thông tin total price của bản ghi; tên cột DB `total_price`. |
| 4 | `status` | Enum `OrderStatus` | Trạng thái hiện tại của bản ghi; mặc định `PENDING`. |
| 5 | `returnStatus` | Enum `ReturnFlowStatus` (nullable) | Lưu thông tin return status của bản ghi; tên cột DB `return_status`; có thể để trống. |
| 6 | `discountId` | VarChar(36) (nullable) | Định danh mã giảm giá liên quan; tên cột DB `discount_id`; có thể để trống. |
| 7 | `discountAmount` | Decimal(10, 2) (nullable) | Số tiền được giảm giá; tên cột DB `discount_amount`; có thể để trống. |
| 8 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |
| 9 | `updatedAt` | DateTime | Thời điểm cập nhật bản ghi gần nhất; tự động cập nhật khi bản ghi thay đổi; tên cột DB `updated_at`. |

## OrderItem (`order_items`)

Chi tiết đơn hàng

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `orderId` | VarChar(36) | Định danh đơn hàng liên quan; tên cột DB `order_id`. |
| 3 | `productId` | VarChar(36) | Định danh sản phẩm liên quan; tên cột DB `product_id`. |
| 4 | `variantId` | VarChar(36) (nullable) | Định danh biến thể sản phẩm liên quan; tên cột DB `variant_id`; có thể để trống. |
| 5 | `quantity` | Int | Số lượng. |
| 6 | `price` | Decimal(10, 2) | Giá bán của sản phẩm hoặc biến thể. |

## Payment (`payments`)

PAYMENT (1 order = 1 payment chính) Thanh toán - 1:1 với đơn hàng

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `orderId` | VarChar(36) | Định danh đơn hàng liên quan; giá trị duy nhất; tên cột DB `order_id`. |
| 3 | `amount` | Decimal(10, 2) | Số tiền giao dịch. |
| 4 | `method` | VarChar(50) | Lưu thông tin method của bản ghi. |
| 5 | `transactionId` | VarChar(255) (nullable) | Lưu thông tin transaction id của bản ghi; giá trị duy nhất; tên cột DB `transaction_id`; có thể để trống. |
| 6 | `status` | Enum `PaymentStatus` | Trạng thái hiện tại của bản ghi; mặc định `PENDING`. |
| 7 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |
| 8 | `paidAt` | DateTime (nullable) | Lưu thông tin paid at của bản ghi; tên cột DB `paid_at`; có thể để trống. |

## PaymentTransaction (`payment_transactions`)

Giao dịch thanh toan online (idempotent qua trang thai PENDING)

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `orderId` | VarChar(36) | Định danh đơn hàng liên quan; giá trị duy nhất; tên cột DB `order_id`. |
| 3 | `orderCode` | VarChar(64) | Lưu thông tin order code của bản ghi; giá trị duy nhất; tên cột DB `order_code`. |
| 4 | `amount` | Decimal(10, 2) | Số tiền giao dịch. |
| 5 | `status` | Enum `PaymentTransactionStatus` | Trạng thái hiện tại của bản ghi; mặc định `PENDING`. |
| 6 | `bankCode` | VarChar(20) (nullable) | Lưu thông tin bank code của bản ghi; tên cột DB `bank_code`; có thể để trống. |
| 7 | `gatewayReference` | VarChar(64) (nullable) | Lưu thông tin gateway reference của bản ghi; giá trị duy nhất; tên cột DB `vnp_transaction_no`; có thể để trống. |
| 8 | `gatewayCode` | VarChar(10) (nullable) | Lưu thông tin gateway code của bản ghi; tên cột DB `vnp_response_code`; có thể để trống. |
| 9 | `gatewayStatus` | VarChar(10) (nullable) | Lưu thông tin gateway status của bản ghi; tên cột DB `vnp_transaction_status`; có thể để trống. |
| 10 | `paidAt` | DateTime (nullable) | Lưu thông tin paid at của bản ghi; tên cột DB `paid_at`; có thể để trống. |
| 11 | `rawPayload` | Json (nullable) | Lưu thông tin raw payload của bản ghi; tên cột DB `raw_payload`; có thể để trống. |
| 12 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |
| 13 | `updatedAt` | DateTime | Thời điểm cập nhật bản ghi gần nhất; tự động cập nhật khi bản ghi thay đổi; tên cột DB `updated_at`. |

## ProductPriceHistory (`product_price_history`)

PRICING HISTORY Lịch sử thay đổi giá - phục vụ analytics và audit

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `productId` | VarChar(36) | Định danh sản phẩm liên quan; tên cột DB `product_id`. |
| 3 | `variantId` | VarChar(36) (nullable) | Định danh biến thể sản phẩm liên quan; tên cột DB `variant_id`; có thể để trống. |
| 4 | `oldPrice` | Decimal(10, 2) | Giá cũ trước khi thay đổi; tên cột DB `old_price`. |
| 5 | `newPrice` | Decimal(10, 2) | Giá mới sau khi thay đổi; tên cột DB `new_price`. |
| 6 | `changedBy` | VarChar(36) (nullable) | Định danh người thực hiện thay đổi; tên cột DB `changed_by`; có thể để trống. |
| 7 | `changedAt` | DateTime | Thời điểm thay đổi; mặc định là thời điểm hiện tại; tên cột DB `changed_at`. |

## Discount (`discounts`)

Mã giảm giá

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `code` | VarChar(50) | Mã định danh nghiệp vụ, thường dùng để tra cứu nhanh; giá trị duy nhất. |
| 3 | `description` | VarChar(500) (nullable) | Mô tả chi tiết; có thể để trống. |
| 4 | `type` | Enum `DiscountType` | Loại nghiệp vụ hoặc phân loại bản ghi. |
| 5 | `value` | Decimal(10, 2) | Giá trị nghiệp vụ. |
| 6 | `maxDiscount` | Decimal(10, 2) (nullable) | Mức giảm giá tối đa; tên cột DB `max_discount`; có thể để trống. |
| 7 | `minOrderAmount` | Decimal(10, 2) (nullable) | Giá trị đơn hàng tối thiểu để áp dụng; tên cột DB `min_order_amount`; có thể để trống. |
| 8 | `maxUsage` | Int (nullable) | Số lượt sử dụng tối đa; tên cột DB `max_usage`; có thể để trống. |
| 9 | `userUsageLimit` | Int (nullable) | Giới hạn lượt sử dụng cho mỗi người dùng; tên cột DB `user_usage_limit`; có thể để trống. |
| 10 | `usedCount` | Int | Số lượt đã sử dụng; mặc định `0`; tên cột DB `used_count`. |
| 11 | `startAt` | DateTime | Thời điểm bắt đầu hiệu lực; tên cột DB `start_at`. |
| 12 | `endAt` | DateTime | Thời điểm kết thúc hiệu lực; tên cột DB `end_at`. |
| 13 | `isActive` | Boolean | Cờ cho biết bản ghi đang được kích hoạt; mặc định `true`; tên cột DB `is_active`. |
| 14 | `bannerImageUrl` | VarChar(1000) (nullable) | Đường dẫn hình ảnh banner; tên cột DB `banner_image_url`; có thể để trống. |
| 15 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |
| 16 | `updatedAt` | DateTime | Thời điểm cập nhật bản ghi gần nhất; tự động cập nhật khi bản ghi thay đổi; tên cột DB `updated_at`. |

## Banner (`banners`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `title` | VarChar(255) | Tiêu đề hiển thị. |
| 3 | `subtitle` | VarChar(255) (nullable) | Tiêu đề phụ hiển thị; có thể để trống. |
| 4 | `description` | VarChar(500) (nullable) | Mô tả chi tiết; có thể để trống. |
| 5 | `imageUrl` | VarChar(1000) | Đường dẫn hình ảnh; tên cột DB `image_url`. |
| 6 | `isActive` | Boolean | Cờ cho biết bản ghi đang được kích hoạt; mặc định `false`; tên cột DB `is_active`. |
| 7 | `sortOrder` | Int | Thứ tự sắp xếp khi hiển thị; mặc định `0`; tên cột DB `sort_order`. |
| 8 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |
| 9 | `updatedAt` | DateTime | Thời điểm cập nhật bản ghi gần nhất; tự động cập nhật khi bản ghi thay đổi; tên cột DB `updated_at`. |

## DiscountUsage (`discount_usages`)

Lịch sử sử dụng mã giảm giá

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `discountId` | VarChar(36) | Định danh mã giảm giá liên quan; tên cột DB `discount_id`. |
| 3 | `userId` | VarChar(36) | Định danh người dùng liên quan; tên cột DB `user_id`. |
| 4 | `orderId` | VarChar(36) | Định danh đơn hàng liên quan; giá trị duy nhất; tên cột DB `order_id`. |

## InventoryLog (`inventory_logs`)

Lịch sử nhập/xuất kho - theo dõi ở cấpđộ variant

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `variantId` | VarChar(36) | Định danh biến thể sản phẩm liên quan; tên cột DB `variant_id`. |
| 3 | `action` | Enum `InventoryAction` | Hành động được ghi nhận. |
| 4 | `quantity` | Int | Số lượng. |
| 5 | `referenceId` | VarChar(36) (nullable) | Định danh tham chiếu tới nghiệp vụ liên quan; tên cột DB `reference_id`; có thể để trống. |
| 6 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |

## Return (`returns`)

Yêu cầu trả hàng - liên kết với từng order_item

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `orderItemId` | VarChar(36) | Định danh chi tiết đơn hàng liên quan; tên cột DB `order_item_id`. |
| 3 | `quantity` | Int | Số lượng. |
| 4 | `reason` | Text (nullable) | Lý do phát sinh yêu cầu hoặc giao dịch; có thể để trống. |
| 5 | `reasonCode` | VarChar(50) (nullable) | Mã lý do theo danh mục quy định; tên cột DB `reason_code`; có thể để trống. |
| 6 | `evidenceImages` | Json (nullable) | Danh sách hình ảnh bằng chứng dạng JSON; tên cột DB `evidence_images`; có thể để trống. |
| 7 | `bankAccountName` | VarChar(255) (nullable) | Tên chủ tài khoản ngân hàng; tên cột DB `bank_account_name`; có thể để trống. |
| 8 | `bankAccountNumber` | VarChar(50) (nullable) | Số tài khoản ngân hàng; tên cột DB `bank_account_number`; có thể để trống. |
| 9 | `bankName` | VarChar(120) (nullable) | Tên ngân hàng; tên cột DB `bank_name`; có thể để trống. |
| 10 | `status` | Enum `ReturnStatus` | Trạng thái hiện tại của bản ghi; mặc định `RT_REQUESTED`. |
| 11 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |

## OrderStatusHistory (`order_status_history`)

Lịch sử thay đổi trạng thái đơn hàng

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `orderId` | VarChar(36) | Định danh đơn hàng liên quan; tên cột DB `order_id`. |
| 3 | `oldStatus` | Enum `OrderStatus` (nullable) | Trạng thái cũ trước khi thay đổi; tên cột DB `old_status`; có thể để trống. |
| 4 | `newStatus` | Enum `OrderStatus` | Trạng thái mới sau khi thay đổi; tên cột DB `new_status`. |
| 5 | `changedBy` | VarChar(36) (nullable) | Định danh người thực hiện thay đổi; tên cột DB `changed_by`; có thể để trống. |
| 6 | `changedAt` | DateTime | Thời điểm thay đổi; mặc định là thời điểm hiện tại; tên cột DB `changed_at`. |

## Notification (`notifications`)

Thông báo cho người dùng

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `userId` | VarChar(36) | Định danh người dùng liên quan; tên cột DB `user_id`. |
| 3 | `content` | Text | Nội dung văn bản. |
| 4 | `isRead` | Boolean | Cờ cho biết thông báo đã được đọc hay chưa; mặc định `false`; tên cột DB `is_read`. |
| 5 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |

## UserActivityLog (`user_activity_logs`)

Lịch sử hoạt động người dùng - phục vụ phân tích AI

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `userId` | VarChar(36) (nullable) | Định danh người dùng liên quan; tên cột DB `user_id`; có thể để trống. |
| 3 | `action` | VarChar(255) | Hành động được ghi nhận. |
| 4 | `metadata` | Json (nullable) | Dữ liệu bổ sung dạng JSON phục vụ mở rộng hoặc phân tích; có thể để trống. |
| 5 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |

## ChatSession (`chat_sessions`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `userId` | VarChar(36) (nullable) | Định danh người dùng liên quan; tên cột DB `user_id`; có thể để trống. |
| 3 | `status` | Enum `ChatSessionStatus` | Trạng thái hiện tại của bản ghi; mặc định `OPEN`. |
| 4 | `channel` | VarChar(40) | Kênh phát sinh phiên chat; mặc định `"WEB_WIDGET"`. |
| 5 | `guestToken` | VarChar(100) (nullable) | Token định danh khách vãng lai; tên cột DB `guest_token`; có thể để trống. |
| 6 | `leadName` | VarChar(120) (nullable) | Tên khách hàng tiềm năng; tên cột DB `lead_name`; có thể để trống. |
| 7 | `leadPhone` | VarChar(20) (nullable) | Số điện thoại khách hàng tiềm năng; tên cột DB `lead_phone`; có thể để trống. |
| 8 | `leadEmail` | VarChar(255) (nullable) | Email khách hàng tiềm năng; tên cột DB `lead_email`; có thể để trống. |
| 9 | `budgetMin` | Decimal(10, 2) (nullable) | Ngân sách tối thiểu khách quan tâm; tên cột DB `budget_min`; có thể để trống. |
| 10 | `budgetMax` | Decimal(10, 2) (nullable) | Ngân sách tối đa khách quan tâm; tên cột DB `budget_max`; có thể để trống. |
| 11 | `shopperProfile` | Json (nullable) | Hồ sơ mua sắm rút ra từ hội thoại; tên cột DB `shopper_profile`; có thể để trống. |
| 12 | `lastIntent` | VarChar(80) (nullable) | Ý định gần nhất của khách hàng; tên cột DB `last_intent`; có thể để trống. |
| 13 | `lastSummary` | VarChar(500) (nullable) | Tóm tắt ngữ cảnh hội thoại gần nhất; tên cột DB `last_summary`; có thể để trống. |
| 14 | `lastSuggestedProductIds` | Json (nullable) | Danh sách sản phẩm đã được gợi ý gần nhất; tên cột DB `last_suggested_product_ids`; có thể để trống. |
| 15 | `lastMessageAt` | DateTime | Thời điểm tin nhắn gần nhất; mặc định là thời điểm hiện tại; tên cột DB `last_message_at`. |
| 16 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |
| 17 | `updatedAt` | DateTime | Thời điểm cập nhật bản ghi gần nhất; tự động cập nhật khi bản ghi thay đổi; tên cột DB `updated_at`. |

## ChatMessage (`chat_messages`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `sessionId` | VarChar(36) | Định danh phiên làm việc hoặc phiên chat liên quan; tên cột DB `session_id`. |
| 3 | `role` | Enum `ChatMessageRole` | Vai trò của tin nhắn trong hội thoại. |
| 4 | `content` | Text | Nội dung văn bản. |
| 5 | `metadata` | Json (nullable) | Dữ liệu bổ sung dạng JSON phục vụ mở rộng hoặc phân tích; có thể để trống. |
| 6 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |

## RecommendationEvent (`recommendation_events`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `eventType` | Enum `RecommendationEventType` | Loại sự kiện hành vi được ghi nhận; tên cột DB `event_type`. |
| 3 | `userId` | VarChar(36) (nullable) | Định danh người dùng liên quan; tên cột DB `user_id`; có thể để trống. |
| 4 | `sessionId` | VarChar(100) | Định danh phiên làm việc hoặc phiên chat liên quan; tên cột DB `session_id`. |
| 5 | `productId` | VarChar(36) (nullable) | Định danh sản phẩm liên quan; tên cột DB `product_id`; có thể để trống. |
| 6 | `orderId` | VarChar(36) (nullable) | Định danh đơn hàng liên quan; tên cột DB `order_id`; có thể để trống. |
| 7 | `searchQuery` | VarChar(255) (nullable) | Từ khóa tìm kiếm của người dùng; tên cột DB `search_query`; có thể để trống. |
| 8 | `dedupeKey` | VarChar(120) | Khóa chống ghi trùng sự kiện; giá trị duy nhất; tên cột DB `dedupe_key`. |
| 9 | `source` | VarChar(100) (nullable) | Nguồn phát sinh sự kiện; có thể để trống. |
| 10 | `placement` | VarChar(120) (nullable) | Vị trí hiển thị hoặc ngữ cảnh phát sinh sự kiện; có thể để trống. |
| 11 | `metadata` | Json (nullable) | Dữ liệu bổ sung dạng JSON phục vụ mở rộng hoặc phân tích; có thể để trống. |
| 12 | `occurredAt` | DateTime | Thời điểm sự kiện thực sự xảy ra; tên cột DB `occurred_at`. |
| 13 | `processedAt` | DateTime (nullable) | Thời điểm xử lý xong; tên cột DB `processed_at`; có thể để trống. |
| 14 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |

## ProductSimilarity (`product_similarities`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `productId` | VarChar(36) | Định danh sản phẩm liên quan; tên cột DB `product_id`. |
| 2 | `relatedProductId` | VarChar(36) | Định danh sản phẩm liên quan/tương tự; tên cột DB `related_product_id`. |
| 3 | `algorithm` | VarChar(50) | Thuật toán dùng để tạo kết quả. |
| 4 | `score` | Decimal(8, 4) | Điểm số đánh giá mức độ phù hợp. |
| 5 | `rank` | Int | Thứ hạng trong danh sách kết quả; mặc định `0`. |
| 6 | `metadata` | Json (nullable) | Dữ liệu bổ sung dạng JSON phục vụ mở rộng hoặc phân tích; có thể để trống. |
| 7 | `updatedAt` | DateTime | Thời điểm cập nhật bản ghi gần nhất; tự động cập nhật khi bản ghi thay đổi; tên cột DB `updated_at`. |
| 8 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |

## RecommendationCache (`recommendation_caches`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `cacheKey` | VarChar(255) | Khóa cache duy nhất; giá trị duy nhất; tên cột DB `cache_key`. |
| 3 | `modelKind` | Enum `RecommendationModelKind` | Loại mô hình gợi ý; tên cột DB `model_kind`. |
| 4 | `userId` | VarChar(36) (nullable) | Định danh người dùng liên quan; tên cột DB `user_id`; có thể để trống. |
| 5 | `productId` | VarChar(36) (nullable) | Định danh sản phẩm liên quan; tên cột DB `product_id`; có thể để trống. |
| 6 | `sessionId` | VarChar(100) (nullable) | Định danh phiên làm việc hoặc phiên chat liên quan; tên cột DB `session_id`; có thể để trống. |
| 7 | `itemsJson` | Json | Danh sách item được cache dạng JSON; tên cột DB `items_json`. |
| 8 | `metadata` | Json (nullable) | Dữ liệu bổ sung dạng JSON phục vụ mở rộng hoặc phân tích; có thể để trống. |
| 9 | `expiresAt` | DateTime | Thời điểm hết hạn; tên cột DB `expires_at`. |
| 10 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |
| 11 | `updatedAt` | DateTime | Thời điểm cập nhật bản ghi gần nhất; tự động cập nhật khi bản ghi thay đổi; tên cột DB `updated_at`. |

## ProductEmbedding (`product_embeddings`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `productId` | VarChar(36) | Định danh sản phẩm liên quan; khóa chính; tên cột DB `product_id`. |
| 2 | `embedding` | Json | Vector embedding lưu dạng JSON. |
| 3 | `embeddingText` | Text (nullable) | Văn bản đầu vào dùng để sinh embedding; tên cột DB `embedding_text`; có thể để trống. |
| 4 | `modelVersion` | VarChar(80) | Phiên bản mô hình AI; tên cột DB `model_version`. |
| 5 | `dimensions` | Int | Các chiều phân tích hoặc số chiều vector. |
| 6 | `metadata` | Json (nullable) | Dữ liệu bổ sung dạng JSON phục vụ mở rộng hoặc phân tích; có thể để trống. |
| 7 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |
| 8 | `updatedAt` | DateTime | Thời điểm cập nhật bản ghi gần nhất; tự động cập nhật khi bản ghi thay đổi; tên cột DB `updated_at`. |

## UserEmbedding (`user_embeddings`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `userId` | VarChar(36) | Định danh người dùng liên quan; khóa chính; tên cột DB `user_id`. |
| 2 | `embedding` | Json | Vector embedding lưu dạng JSON. |
| 3 | `modelVersion` | VarChar(80) | Phiên bản mô hình AI; tên cột DB `model_version`. |
| 4 | `dimensions` | Int | Các chiều phân tích hoặc số chiều vector. |
| 5 | `lastEventAt` | DateTime (nullable) | Thời điểm sự kiện gần nhất dùng cho embedding; tên cột DB `last_event_at`; có thể để trống. |
| 6 | `metadata` | Json (nullable) | Dữ liệu bổ sung dạng JSON phục vụ mở rộng hoặc phân tích; có thể để trống. |
| 7 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |
| 8 | `updatedAt` | DateTime | Thời điểm cập nhật bản ghi gần nhất; tự động cập nhật khi bản ghi thay đổi; tên cột DB `updated_at`. |

## RecommendationExperiment (`recommendation_experiments`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `key` | VarChar(80) | Khóa định danh cấu hình/thử nghiệm; giá trị duy nhất. |
| 3 | `name` | VarChar(255) | Tên hiển thị của bản ghi. |
| 4 | `description` | VarChar(500) (nullable) | Mô tả chi tiết; có thể để trống. |
| 5 | `status` | VarChar(40) | Trạng thái hiện tại của bản ghi. |
| 6 | `traffic` | Int | Tỷ lệ traffic tham gia thử nghiệm; mặc định `100`. |
| 7 | `variants` | Json | Danh sách biến thể thử nghiệm dạng JSON. |
| 8 | `metadata` | Json (nullable) | Dữ liệu bổ sung dạng JSON phục vụ mở rộng hoặc phân tích; có thể để trống. |
| 9 | `startAt` | DateTime (nullable) | Thời điểm bắt đầu hiệu lực; tên cột DB `start_at`; có thể để trống. |
| 10 | `endAt` | DateTime (nullable) | Thời điểm kết thúc hiệu lực; tên cột DB `end_at`; có thể để trống. |
| 11 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |
| 12 | `updatedAt` | DateTime | Thời điểm cập nhật bản ghi gần nhất; tự động cập nhật khi bản ghi thay đổi; tên cột DB `updated_at`. |

## RecommendationMetricSnapshot (`recommendation_metric_snapshots`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `metricDate` | DateTime | Ngày ghi nhận chỉ số; tên cột DB `metric_date`. |
| 3 | `metricName` | VarChar(120) | Tên chỉ số; tên cột DB `metric_name`. |
| 4 | `metricValue` | Decimal(14, 4) | Giá trị của chỉ số; tên cột DB `metric_value`. |
| 5 | `dimensions` | Json (nullable) | Các chiều phân tích hoặc số chiều vector; có thể để trống. |
| 6 | `metadata` | Json (nullable) | Dữ liệu bổ sung dạng JSON phục vụ mở rộng hoặc phân tích; có thể để trống. |
| 7 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |

## Wishlist (`wishlists`)

Danh sách yêu thích

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `userId` | VarChar(36) | Định danh người dùng liên quan; tên cột DB `user_id`. |
| 3 | `productId` | VarChar(36) | Định danh sản phẩm liên quan; tên cột DB `product_id`. |
| 4 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |

## Review (`reviews`)

Đánh giá sản phẩm - mỗi user chỉ đánh giá 1 lần/sản phẩm

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `userId` | VarChar(36) | Định danh người dùng liên quan; tên cột DB `user_id`. |
| 3 | `productId` | VarChar(36) | Định danh sản phẩm liên quan; tên cột DB `product_id`. |
| 4 | `orderItemId` | VarChar(36) (nullable) | Định danh chi tiết đơn hàng liên quan; tên cột DB `order_item_id`; có thể để trống. |
| 5 | `rating` | Int | 1-5. |
| 6 | `comment` | Text (nullable) | Nội dung bình luận/đánh giá; có thể để trống. |
| 7 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |

## ReviewImage (`review_images`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `reviewId` | VarChar(36) | Định danh đánh giá liên quan; tên cột DB `review_id`. |
| 3 | `url` | VarChar(1000) | Đường dẫn tài nguyên hoặc hình ảnh. |
| 4 | `publicId` | VarChar(255) (nullable) | Định danh tài nguyên trên dịch vụ lưu trữ bên ngoài; tên cột DB `public_id`; có thể để trống. |
| 5 | `sortOrder` | Int | Thứ tự sắp xếp khi hiển thị; mặc định `0`; tên cột DB `sort_order`. |
| 6 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |

## AuditLog (`audit_logs`)

Nhật ký kiểm toán - theo dõi mọi thay đổi trong hệ thống

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `actorType` | Enum `ActorType` | Loại tác nhân thực hiện hành động; tên cột DB `actor_type`. |
| 3 | `actorId` | VarChar(36) (nullable) | Định danh tác nhân thực hiện hành động; tên cột DB `actor_id`; có thể để trống. |
| 4 | `targetType` | VarChar(100) (nullable) | Loại đối tượng bị tác động; tên cột DB `target_type`; có thể để trống. |
| 5 | `targetId` | VarChar(36) (nullable) | Định danh đối tượng bị tác động; tên cột DB `target_id`; có thể để trống. |
| 6 | `action` | VarChar(255) | Hành động được ghi nhận. |
| 7 | `oldData` | Json (nullable) | Dữ liệu trước khi thay đổi; tên cột DB `old_data`; có thể để trống. |
| 8 | `newData` | Json (nullable) | Dữ liệu sau khi thay đổi; tên cột DB `new_data`; có thể để trống. |
| 9 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |

## RefundTransaction (`refund_transactions`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `orderId` | VarChar(36) | Định danh đơn hàng liên quan; tên cột DB `order_id`. |
| 3 | `type` | Enum `RefundType` | Loại nghiệp vụ hoặc phân loại bản ghi. |
| 4 | `amount` | Decimal(10, 2) | Số tiền giao dịch. |
| 5 | `currency` | VarChar(10) | Đơn vị tiền tệ; mặc định `"VND"`. |
| 6 | `status` | Enum `RefundStatus` | Trạng thái hiện tại của bản ghi; mặc định `PENDING`. |
| 7 | `provider` | VarChar(50) (nullable) | Nhà cung cấp dịch vụ/tích hợp bên ngoài; có thể để trống. |
| 8 | `providerRefundId` | VarChar(100) (nullable) | Định danh hoàn tiền từ nhà cung cấp; giá trị duy nhất; tên cột DB `provider_refund_id`; có thể để trống. |
| 9 | `reason` | Text (nullable) | Lý do phát sinh yêu cầu hoặc giao dịch; có thể để trống. |
| 10 | `initiatedBy` | Enum `ActorType` | Tác nhân khởi tạo giao dịch; mặc định `SYSTEM`; tên cột DB `initiated_by`. |
| 11 | `idempotencyKey` | VarChar(120) | Khóa idempotency để tránh xử lý trùng; giá trị duy nhất; tên cột DB `idempotency_key`. |
| 12 | `failureReason` | VarChar(500) (nullable) | Lý do thất bại nếu giao dịch không thành công; tên cột DB `failure_reason`; có thể để trống. |
| 13 | `retryCount` | Int | Số lần thử lại; mặc định `0`; tên cột DB `retry_count`. |
| 14 | `requestedAt` | DateTime | Thời điểm gửi yêu cầu; mặc định là thời điểm hiện tại; tên cột DB `requested_at`. |
| 15 | `processedAt` | DateTime (nullable) | Thời điểm xử lý xong; tên cột DB `processed_at`; có thể để trống. |
| 16 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |
| 17 | `updatedAt` | DateTime | Thời điểm cập nhật bản ghi gần nhất; tự động cập nhật khi bản ghi thay đổi; tên cột DB `updated_at`. |

## OrderCancelRequest (`order_cancel_requests`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Mô tả |
|---:|---|---|---|
| 1 | `id` | VarChar(36) | Định danh duy nhất của bản ghi; khóa chính; tự động tạo UUID. |
| 2 | `orderId` | VarChar(36) | Định danh đơn hàng liên quan; giá trị duy nhất; tên cột DB `order_id`. |
| 3 | `reasonCode` | Enum `CancelReason` | Mã lý do theo danh mục quy định; tên cột DB `reason_code`. |
| 4 | `reasonText` | VarChar(500) (nullable) | Lý do dạng văn bản tự do; tên cột DB `reason_text`; có thể để trống. |
| 5 | `status` | Enum `CancelRequestStatus` | Trạng thái hiện tại của bản ghi; mặc định `REQUESTED`. |
| 6 | `requestedByUserId` | VarChar(36) | Định danh người dùng gửi yêu cầu; tên cột DB `requested_by_user_id`. |
| 7 | `approvedByAdminId` | VarChar(36) (nullable) | Định danh admin phê duyệt; tên cột DB `approved_by_admin_id`; có thể để trống. |
| 8 | `rejectedByAdminId` | VarChar(36) (nullable) | Định danh admin từ chối; tên cột DB `rejected_by_admin_id`; có thể để trống. |
| 9 | `approvedAt` | DateTime (nullable) | Thời điểm phê duyệt; tên cột DB `approved_at`; có thể để trống. |
| 10 | `rejectedAt` | DateTime (nullable) | Thời điểm từ chối; tên cột DB `rejected_at`; có thể để trống. |
| 11 | `completedAt` | DateTime (nullable) | Thời điểm hoàn tất; tên cột DB `completed_at`; có thể để trống. |
| 12 | `rejectionReason` | VarChar(500) (nullable) | Lý do từ chối yêu cầu; tên cột DB `rejection_reason`; có thể để trống. |
| 13 | `bankAccountName` | VarChar(255) | Tên chủ tài khoản ngân hàng; tên cột DB `bank_account_name`. |
| 14 | `bankAccountNumber` | VarChar(50) | Số tài khoản ngân hàng; tên cột DB `bank_account_number`. |
| 15 | `bankName` | VarChar(120) | Tên ngân hàng; tên cột DB `bank_name`. |
| 16 | `createdAt` | DateTime | Thời điểm tạo bản ghi; mặc định là thời điểm hiện tại; tên cột DB `created_at`. |
| 17 | `updatedAt` | DateTime | Thời điểm cập nhật bản ghi gần nhất; tự động cập nhật khi bản ghi thay đổi; tên cột DB `updated_at`. |
