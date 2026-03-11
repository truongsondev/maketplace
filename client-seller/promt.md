# PRODUCT MANAGEMENT UI SPECIFICATION PROMPT

## ROLE

Bạn là **Senior Frontend Engineer chuyên ReactJS + TypeScript** với kinh nghiệm xây dựng **Admin Dashboard cho hệ thống Ecommerce quy mô lớn**.

Bạn có tư duy về:

- UI/UX cho dashboard
- Component architecture
- State management
- Data table performance
- Scalable frontend structure

---

# SCOPE

Thiết kế lại **Product Management Page** cho hệ thống admin ecommerce.

Bao gồm:

1. Trang **Product List**
2. Trang **Product Detail** với **4 tabs quản lý**
3. Phân tích UX
4. Mô tả UI chi tiết cho từng phần
5. Đề xuất cải tiến UX nếu cần

---

# CONTEXT

Trang quản lý sản phẩm phải hỗ trợ:

- Quản lý hàng nghìn sản phẩm
- Có nhiều variants
- Quản lý tồn kho
- Quản lý images
- Bulk actions
- Search và filter mạnh

Thiết kế phải tối ưu cho:

- Hiệu năng
- Khả năng mở rộng
- Trải nghiệm admin

---

# INSTRUCTION

Thực hiện theo các bước sau:

1. Phân tích yêu cầu nghiệp vụ
2. Thiết kế UI/UX cho Product List
3. Thiết kế UI/UX cho Product Detail
4. Mô tả chi tiết từng tab
5. Đề xuất cải tiến UX
6. Đảm bảo UI phù hợp cho hệ thống ecommerce lớn

---

# FEATURE REQUIREMENTS

---

# 1. PRODUCT LIST PAGE

Trang hiển thị danh sách sản phẩm.

## Bảng danh sách sản phẩm

Các cột cần hiển thị:

- Checkbox (select nhiều sản phẩm)
- Ảnh đại diện (primary image)
- Tên sản phẩm
- SKU đầu tiên hoặc số lượng variants
- Giá base hoặc khoảng giá (min - max)
- Tổng tồn kho (sum từ variants)
- Danh mục
- Trạng thái (Active / Inactive / Deleted)
- Ngày tạo
- Actions (Edit, Delete, Duplicate)

---

## Search

Thanh tìm kiếm hỗ trợ **fulltext search** theo:

- Tên sản phẩm
- SKU
- Tags

Có debounce để giảm request.

---

## Filters

Cho phép lọc theo:

### Category

- Dropdown
- Hỗ trợ cây danh mục phân cấp

Ví dụ:

Electronics
└── Phone
└── Laptop

---

### Status

- All
- Active
- Inactive
- Deleted

---

### Price Range

Lọc theo khoảng giá.

Ví dụ:

0 - 100
100 - 500
500+

---

### Inventory

Lọc theo trạng thái tồn kho:

- All
- Low stock
- Out of stock

---

### Tags

Multi-select autocomplete.

---

## Sorting

Cho phép sắp xếp theo:

- Tên
- Giá
- Ngày tạo
- Tồn kho

Có thể đổi chiều:

ASC / DESC

---

## Bulk Actions

Cho phép chọn nhiều sản phẩm để thao tác hàng loạt.

Các hành động gồm:

- Delete nhiều sản phẩm
- Gán danh mục hàng loạt
- Gán tags hàng loạt
- Export CSV

---

# 2. PRODUCT DETAIL PAGE

Khi click vào một sản phẩm sẽ mở **Product Detail Page**.

Trang này có **4 tabs chính**:

1. Basic Information
2. Variants
3. Images
4. Inventory

---

# TAB 1: BASIC INFORMATION

Quản lý thông tin cơ bản của sản phẩm.

## Fields

### Product Name

- Input text
- Required

---

### Description

Rich text editor hỗ trợ:

- Bold
- Italic
- Lists
- Links
- Images

---

### Images

Hiển thị **primary image** của sản phẩm.

Cho phép:

- Thay đổi primary image
- Chọn từ image gallery

---

### Base Price

Hiển thị giá cơ bản của sản phẩm.

Nếu có variants thì:

- Giá sẽ được tính từ variants
- Base price chỉ hiển thị

---

### Categories

Multi-select dropdown hỗ trợ cây danh mục.

---

### Tags

Multi-select với autocomplete.

---

### Status

Toggle:

- Active
- Inactive

---

# TAB 2: VARIANTS

Quản lý các biến thể của sản phẩm.

## Variant Table

Các cột gồm:

- SKU (unique, required)
- Attributes (color, size...)
- Price
- Available Stock
- Reserved Stock
- Minimum Stock (low stock warning)
- Image
- Actions (Edit / Delete)

---

## Add Variant

Có nút **Add Variant** để thêm biến thể mới.

Click sẽ mở modal.

---

## Add Variant Modal

Các trường gồm:

### SKU

Cho phép:

- Generate tự động
- Hoặc nhập thủ công

---

### Attributes

Dynamic attributes.

Ví dụ:

Color → color picker
Size → dropdown

Dữ liệu lưu dưới dạng JSON.

---

### Price

Giá bán của variant.

---

### Stock

Số lượng tồn kho ban đầu.

---

### Image

Có thể gán ảnh riêng cho variant.

---

# TAB 3: IMAGES

Quản lý hình ảnh của sản phẩm.

---

## Upload Images

Hỗ trợ:

- Drag & Drop
- Upload nhiều ảnh cùng lúc

---

## Image Preview

Hiển thị grid thumbnails.

Mỗi ảnh có thể:

- Set primary image
- Edit alt text
- Assign to variant
- Delete image

---

## Sort Order

Cho phép kéo thả để thay đổi thứ tự ảnh.

---

## Assign Image To Variant

Ảnh có thể gán cho:

- Tất cả variants
- Một variant cụ thể

---

# TAB 4: INVENTORY

Theo dõi lịch sử thay đổi tồn kho.

---

## Inventory Table

Các cột:

- Variant SKU
- Action (IMPORT / EXPORT / RETURN / ADJUSTMENT)
- Quantity
- Reference (Order ID, Return ID...)
- Timestamp
- Actor (Admin thực hiện)

---

## Quick Actions

Admin có thể thao tác nhanh:

- Adjust stock
- Bulk import inventory (CSV)
- Set low stock alert threshold

---

# OUTPUT REQUIREMENTS

Khi trả lời cần:

1. Phân tích UI/UX
2. Mô tả layout từng phần
3. Đề xuất cải tiến nếu cần
4. Đảm bảo thiết kế phù hợp với hệ thống ecommerce lớn

---

# CONSTRAINTS

- Không tạo file markdown riêng
- Không comment trong code
- Tập trung vào UI/UX specification
- Thiết kế phải scalable

---

# EXPECTED RESULT

Một bản **UI Specification chi tiết cho Product Management System** có thể dùng trực tiếp cho:

- Frontend development
- Product design
- Engineering discussion

# DESIGN API AT SERVER BACKEND

- Các API mà server đã thiết kế mà bạn có thể sử dụng để đạt được các yêu cầu trên
