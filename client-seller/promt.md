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

Thực hiện chức năng gett all sản phẩm trong giỏ hàng

# INSTRUCTION

Thực hiện theo các bước sau:

1. Phân tích yêu cầu nghiệp vụ
2. Đọc Request

### Add to Cart - Success Case

POST api/cart/items
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
"variantId": "{{variantId}}",
"quantity": 2
}
