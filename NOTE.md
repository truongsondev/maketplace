# Chatbot Sales Context

- Feature mới: chatbot bán hàng public cho website thời trang AURA.
- Backend route public:
  - `POST /api/chatbot/sessions`
  - `GET /api/chatbot/sessions/:sessionId`
  - `POST /api/chatbot/sessions/:sessionId/messages`
- Frontend widget:
  - component `client-next/components/chatbot/chatbot-widget.tsx`
  - mount global trong `client-next/app/layout.tsx`
  - session id lưu ở localStorage key `aura-chatbot-session-id`

# Backend Architecture

- Module mới theo clean architecture: `server/src/module/chatbot`
  - `applications`
  - `infrastructure`
  - `interface-adapter`
  - `di.ts`
- Session được coi là lead session theo đúng yêu cầu trong `traing.md`.
- Trạng thái chính:
  - `OPEN`
  - `QUALIFIED`
  - `CONTACT_CAPTURED`
  - `ESCALATED`
  - `CLOSED`
- Data model mới trong Prisma:
  - `chat_sessions`
  - `chat_messages`
- Migration đã thêm:
  - `server/prisma/migrations/20260513100000_add_chatbot_tables/migration.sql`

# Current Chatbot Behavior

- Chatbot hiện chạy bằng deterministic sales assistant, chưa phụ thuộc API key LLM nên môi trường hiện tại chạy được ngay.
- Có thể tự nhận diện:
  - ngân sách
  - màu
  - size
  - use case như đi làm, đi chơi, thể thao, dự tiệc
  - email / số điện thoại để capture lead
- Gợi ý sản phẩm dùng dữ liệu thật từ catalog qua `GetProductsUseCase`.
- Assistant message có thể trả kèm:
  - product cards
  - quick replies

# Product Readiness Assessment

- Những gì hiện tại đã đủ tốt để chatbot tận dụng:
  - filter theo `category`, `size`, `color`, `usageOccasion`, `priceRange`, `search`
  - dữ liệu ảnh chính, giá thấp nhất, tồn kho variant
  - category hierarchy đủ để gợi ý theo nhóm sản phẩm
  - `usage_occasions` đã là tín hiệu rất hữu ích cho tư vấn thời trang

- Những gì còn thiếu nếu muốn chatbot bán hàng mạnh hơn:
  - benefit-based data chuẩn hóa cho từng sản phẩm
    - ví dụ: tôn dáng, co giãn, mát, ít nhăn, phù hợp dáng người nào
  - style taxonomy rõ ràng
    - ví dụ: minimal, street, feminine, smart casual
  - fit/body-shape guidance
  - seasonal/context tags
    - nắng nóng, mưa, du lịch, công sở mùa lạnh
  - ranking signal riêng cho chatbot
    - conversion rate theo sản phẩm được giới thiệu trong chat
  - lead handoff workflow cho admin/CRM nội bộ
    - hiện mới lưu lead trong chat session, chưa có màn admin xử lý lead
  - auto-close-order workflow an toàn
    - hiện checkout cần auth + shipping + payment flow riêng, chưa nên để chatbot tạo đơn hoàn toàn tự động

# Suggested Next Step

- Nếu mở rộng tiếp, nên làm theo thứ tự:
  1. admin lead inbox cho chat sessions có `CONTACT_CAPTURED`
  2. enrich product metadata bằng benefit/style/body-fit
  3. tách assistant engine thành tool-calling LLM adapter có fallback hiện tại
  4. sau cùng mới nối chatbot vào add-to-cart / checkout flow có kiểm soát

# Luxury Fashion UI/UX Redesign Context

- Mục tiêu visual mới cho `client-next`: website phải giống một fashion brand cao cấp, không giống marketplace/Shopee/Lazada/admin dashboard.
- Direction tham khảo: Apple, Zara, Farfetch, Gucci, Dior, COS, Saint Laurent, Aesop, Gentle Monster.
- Cảm giác cần giữ xuyên suốt:
  - luxury
  - premium
  - modern
  - cinematic
  - editorial fashion magazine
  - nhiều whitespace
  - image-focused
  - typography lớn, hierarchy rõ
  - motion mượt nhưng tinh tế
- Palette ưu tiên:
  - black
  - white
  - cream / ivory
  - beige
  - neutral gray
  - gold accent rất nhẹ
- Tránh:
  - màu neon / màu quá chói
  - gradient rẻ tiền
  - border/shadow dày đặc
  - card UI cứng kiểu dashboard
  - animation bounce/gaming/trẻ con
  - bố cục marketplace nhiều block lặp
- Frontend tech:
  - Next.js App Router
  - TypeScript
  - TailwindCSS
  - Framer Motion
  - reusable component architecture
  - không dùng mock data
- Các bề mặt đã redesign:
  - `client-next/app/page.tsx`
    - full-screen cinematic hero
    - editorial category grid bất đối xứng
    - new arrivals dùng `ProductCard`
    - category showcases dùng layout collection-led, image lớn
    - brand value section tối giản/dark premium
  - `client-next/components/page/header.tsx`
    - navbar transparent ở top, blur/cream background khi scroll
    - navigation uppercase tracking rộng
    - search overlay lớn, editorial hơn
  - `client-next/components/page/product-card.tsx`
    - Farfetch/COS-like quiet card
    - Next Image optimization
    - hover image zoom cinematic
    - wishlist/action floating buttons tinh tế
  - `client-next/components/page/recommendation-shelf.tsx`
    - “Gợi ý cho bạn” thành horizontal luxury carousel
    - personalized feeling với label/strategy
    - skeleton loading dạng strip
  - `client-next/components/page/footer.tsx`
    - dark editorial footer, ít marketplace text block hơn
- Animation strategy:
  - dùng `framer-motion` cho reveal/stagger/viewport animation ở component ít tần suất
  - dùng CSS transition cho hover zoom/action để nhẹ FPS
  - không scale font theo viewport width
  - tránh motion quá flashy
- Performance guardrails:
  - ưu tiên `next/image`
  - animation chỉ chạy khi vào viewport
  - không tạo layout shift cho card/grid/carousel
  - sau thay đổi phải chạy `npx eslint ...` và `npm run build`
- Dev server redesign gần nhất đã chạy ở `http://localhost:3002`.

## Full Website UI/UX Refinement Context

- Yêu cầu tiếp theo: đồng bộ luxury design language trên toàn bộ customer journey, không chỉ homepage.
- Các page/surface đang được đưa về cùng hệ thống:
  - collection/category listing
  - product detail
  - cart/shopping bag
  - checkout confirm
  - favorites/wishlist
  - profile/account
  - auth layout/login/register
- Global utility mới trong `client-next/app/globals.css`:
  - `luxury-page`
  - `luxury-container`
  - `luxury-eyebrow`
  - `luxury-title`
  - `luxury-copy`
  - `luxury-panel`
  - `luxury-button`
  - `luxury-button-ghost`
  - `luxury-field`
  - `luxury-skeleton`
- Design consistency target:
  - nền ivory/cream, text black/neutral, dark mode giữ contrast sạch
  - border mảnh `black/10`, shadow rất nhẹ
  - section/panel vuông vức hơn, tránh rounded/card marketplace quá nhiều
  - uppercase eyebrow tracking rộng cho editorial feeling
  - CTA đen/trắng tối giản, hover tinh tế
- Motion/performance:
  - dùng Framer Motion cho reveal/stagger ở hero/listing/recommendation
  - dùng CSS transition cho hover/zoom/action states để nhẹ
  - tránh animation flashy/bounce
  - sau khi chỉnh page diện rộng phải chạy prettier, eslint và build.

# Recommendation Correctness Context

- Personalized recommendation phải dựa trên `user_id` hiện tại và session hiện tại, không dùng cache global để thay thế khi user đã có interaction.
- `POST /api/track` là public nhưng nếu có bearer token thì auth middleware phải attach `req.userId` để event không bị lưu `user_id = NULL`.
- Tracking event quan trọng như favorite/add cart/search cần persist gần realtime trước khi UI reload/refetch.
- Redis key chính:
  - `recommendations:personalized:v2:{userId}:{sessionId}:{limit}`
  - `recommendations:home:{sessionId}:{limit}`
  - `recommendations:cart:{userId}:{limit}`
  - `recommendations:product:{productId}:{limit}`
- Personalized cold-start mới được dùng trending fallback; khi đã có interaction thì không append global/home feed vào personalized.
- Khi query personalized, session events chỉ được lấy nếu `user_id IS NULL`; tránh user A logout rồi user B login cùng browser bị ăn lịch sử của user A.
- Frontend React Query key phải chứa `userId` và/hoặc `sessionId` tương ứng endpoint để không reuse cache sai phiên/tài khoản.
