# PRODUCT MANAGEMENT UI SPECIFICATION PROMPT

## ROLE

Bạn là **Senior Frontend Engineer chuyên NextJS + TypeScript** với kinh nghiệm xây dựng **Website Thương Mại Điện Tử**.

Bạn có tư duy về:

- UI/UX cho dashboard
- Component architecture
- State management
- Data table performance
- Scalable frontend structure

---

# SCOPE



---

# CONTEXT
Refactor UI trang home

# INSTRUCTION

1. Phân tích **<CONTEXT>**

# 🎯 Prompt: Thiết kế UI Trang Home E-commerce Thời Trang (Phong cách YaMe)

## 🧠 Mục tiêu tổng thể

Thiết kế một trang HOME cho website thương mại điện tử thời trang theo phong cách tối giản, hiện đại, tập trung vào hình ảnh sản phẩm và tối ưu chuyển đổi (conversion-focused).

Phong cách:
- Minimalist
- Streetwear Việt Nam
- Premium nhưng đơn giản
- Ít text, nhiều khoảng trắng
- Tập trung vào sản phẩm

Màu sắc chính:
- Đen (#000000)
- Trắng (#FFFFFF)
- Xám nhạt (#F5F5F5)
- Xám chữ (#222222)

Typography:
- Sans-serif (Inter / Helvetica)
- Heading lớn, đậm
- Text rõ ràng, dễ đọc

---

# 🧱 Bố cục tổng thể trang Home

Flow trải nghiệm:

Hero → Category → New Arrivals → Promo → Best Seller → Brand Value → Newsletter → Footer

---

# 🧩 1. HEADER

## Màu sắc
- Nền trắng
- Text đen
- Border dưới xám nhẹ

## Bố cục
- Trái: logo text đơn giản
- Giữa: menu (New Arrivals, Men, Women, Tops, Bottoms, Accessories, Sale)
- Phải: icon search, account, cart (có badge số lượng)

## UX mục tiêu
- Điều hướng nhanh
- Nhận diện thương hiệu
- Không rối, không quá nhiều chi tiết

---

# 🎯 2. HERO BANNER

## Màu sắc
- Ảnh full width (streetwear lifestyle)
- Overlay đen nhẹ (20–30%)
- Text trắng

## Bố cục
- Label nhỏ
- Heading lớn (IN HOA, đậm)
- Subtitle ngắn
- Nút CTA (Mua ngay / Shop Now)

## UX mục tiêu
- Thu hút attention ngay lập tức
- Đẩy campaign / collection chính
- Tạo cảm xúc thời trang

---

# 🧩 3. FEATURED CATEGORIES

## Màu sắc
- Nền trắng
- Card ảnh
- Hover overlay nhẹ

## Bố cục
- Grid 3–4 cột
- Mỗi card:
  - Ảnh category
  - Tên category

## UX mục tiêu
- Giúp user chọn nhanh danh mục
- Giảm thời gian tìm kiếm

---

# 🛍️ 4. NEW ARRIVALS

## Màu sắc
- Nền trắng
- Card trắng + shadow nhẹ
- Badge: đen / đỏ nhạt

## Bố cục
- Grid 4 cột (desktop)
- Card gồm:
  - Ảnh lớn
  - Tên sản phẩm
  - Giá
  - Badge (New / Sale)

## Hover
- Zoom ảnh nhẹ
- Đổi ảnh thứ 2 (nếu có)
- Shadow nhẹ

## UX mục tiêu
- Highlight sản phẩm mới
- Tạo cảm giác fresh

---

# 🧨 5. PROMO BANNER

## Màu sắc
- Contrast mạnh (đen / ảnh lifestyle)
- Text trắng hoặc đen tùy nền

## Bố cục
- Banner ngang full width
- Text ngắn + CTA

## UX mục tiêu
- Đẩy khuyến mãi
- Kích thích hành động nhanh

---

# 🔥 6. BEST SELLERS

## Màu sắc
- giống New Arrivals

## Bố cục
- Grid sản phẩm
- Badge “Hot” / “Best Seller”

## UX mục tiêu
- Social proof
- Tăng độ tin tưởng

---

# 🧠 7. BRAND VALUE

## Màu sắc
- Nền xám nhạt (#F5F5F5)
- Icon đen
- Text xám đậm

## Bố cục
- 3–4 cột ngang
- Mỗi item:
  - Icon
  - Title
  - Mô tả ngắn

Ví dụ:
- Giao hàng nhanh
- Đổi trả dễ dàng
- Chất lượng cao
- Thanh toán an toàn

## UX mục tiêu
- Tăng trust
- Giảm lo lắng trước khi mua

---

# 📧 8. NEWSLETTER

## Màu sắc
- Nền trắng hoặc xám rất nhạt

## Bố cục
- Title
- Subtitle
- Input email
- Button subscribe

## UX mục tiêu
- Thu thập email
- Giữ user quay lại

---

# 🧱 9. FOOTER

## Màu sắc
- Nền trắng hoặc đen
- Text xám

## Bố cục
- Nhiều cột:
  - Shop
  - Support
  - About
  - Policies
- Icon social
- Copyright

## UX mục tiêu
- Cung cấp thông tin
- Tăng độ tin cậy

---

# 🎯 Nguyên tắc thiết kế quan trọng

1. Product-first:
   - Ảnh lớn, rõ
   - Ít text

2. Spacing rộng:
   - Padding lớn
   - Không nhồi nhét

3. Tương phản rõ:
   - Đen – trắng – xám

4. Animation nhẹ:
   - Hover mượt
   - Không lạm dụng

5. Scroll mượt:
   - Flow logic từ trên xuống

---

# 🚀 Kết quả mong muốn

Tạo một trang Home:
- Nhìn premium
- Dễ sử dụng
- Tập trung vào sản phẩm
- Tối ưu conversion
- Giống phong cách website thời trang hiện đại (Shopify-style)
# NOTE
- Sử dụng APi thật
- Không dùng mock data