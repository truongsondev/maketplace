# Chatbot Sales Context

# Admin Operational Intelligence Refactor Context

- Current request: refactor `client-seller` admin from CRUD/table management into an “Operational Intelligence Dashboard” / ecommerce command center.
- Primary goal: not only prettier UI, but stronger decision flow:
  - surface what is urgent first
  - expose anomalies, SLA risk, refund/cancel/payment issues
  - connect data between modules
  - reduce manual scanning and cognitive load
  - make admin feel like enterprise-grade SaaS control center
- Visual direction: Linear, Stripe Dashboard, Shopify Admin, Vercel Analytics, Notion Enterprise, Framer Dashboard.
- Required feeling:
  - luxury
  - modern
  - clean
  - premium
  - fast-feeling
  - data-focused
  - operational
  - high-end SaaS
- Priority hierarchy:
  - Priority 1: alerts, bad KPIs, anomalies, SLA warnings, refund spikes, conversion drops.
  - Priority 2: executive KPIs such as revenue, net revenue, orders, AOV, cancellation rate, refund rate, successful payment rate, repeat customer rate.
  - Priority 3: CRUD/table details.
- Dashboard must become Command Center with:
  - executive KPI cards with current value, previous-period comparison, trend %, sparkline, status healthy/warning/danger
  - operational alerts with severity, icon, quick action, drill-down feel
  - smart insights cards with explanation and priority
  - advanced analytics charts with comparison overlay, segmented metrics, anomaly highlights
- Page repositioning:
  - Orders -> Operations Queue with priority queue, SLA risk, suspicious/high-refund/failed-payment indicators, visible quick actions, richer detail timeline/payment/refund/customer risk summary.
  - Products -> Inventory & Product Health with low/dead/fast-moving stock, reorder candidates, refund/conversion/margin intelligence, progress/heat/urgency visuals.
  - Users -> Customer Intelligence with new/returning/VIP/dormant/churn risk segments, purchase frequency, last order, refunds, basket size, retention signal, linked histories.
  - Refunds -> Service Quality Monitor with root cause analysis, SKU/category/payment trend, SLA tracking and failed-refund alerts.
  - Vouchers -> Promotion Performance Dashboard with usage, generated revenue, discount cost, ROI estimate, profit impact, abuse/loss highlights.
  - Banners -> Banner Performance with CTR, conversion, revenue contribution, preview states, scheduling and analytics overlay.
  - Logs -> Operational Monitoring with info/warning/critical severity, grouping by payment/auth/inventory/API failures, sticky actionable critical events.
- Global UX improvements:
  - KPI/alert/chart drill-down navigation feel through links, filters or contextual CTAs.
  - Better table UX: sticky headers, quick filters, saved-filter chips, inline actions, row highlights, expandable/context rows.
  - Premium motion: subtle transitions, hover elevation, KPI animation feel, pulse only for live/critical states.
  - Real-time feeling: live indicators, updating metrics, pulse alerts, realtime notification affordances.
- New admin idea:
  - Add action `Đánh giá tình hình` on major tabs like Dashboard, Orders, Products.
  - Assessment must be derived from real metrics already loaded from DB/API, not mock text.
  - First implementation can be deterministic rule-based synthesis on frontend from real backend analytics.
  - Later extension can move this synthesis to backend/AI service for richer narrative and auditability.
- Implementation reminder:
  - Analyze current pages first, then refactor component structure.
  - Prefer reusable analytics/admin widgets and shared design tokens in `client-seller`.
  - Keep backend/API compatibility where possible; use derived/demo operational metrics from available data if endpoints do not expose all requested intelligence yet.
  - If context is lost, reread this section before continuing.

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
