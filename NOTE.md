# Chatbot Sales Context

# Gemini LLM Tool Calling Chatbot Context

- Ngày 2026-05-17 đã nâng cấp chatbot AURA Phase 1 theo `GEMINI_FREE_PLAN_FOR_AURA_CHATBOT.md`.
- Backend vẫn giữ API public hiện có, không đổi contract frontend:
  - `POST /api/chatbot/sessions`
  - `GET /api/chatbot/sessions/:sessionId`
  - `POST /api/chatbot/sessions/:sessionId/messages`
- Các file mới:
  - `server/src/module/chatbot/applications/ports/output/chatbot-llm-client.ts`
  - `server/src/module/chatbot/applications/tools/search-products.tool.ts`
  - `server/src/module/chatbot/applications/services/chatbot-llm-orchestrator.service.ts`
  - `server/src/module/chatbot/infrastructure/llm/gemini-chat.client.ts`
  - `server/doc-api/chatbot-llm-gemini.md`
- `SendChatMessageUseCase` giờ ưu tiên `ChatbotLLMOrchestratorService` khi:
  - `CHATBOT_LLM_ENABLED=true`
  - `CHATBOT_LLM_PROVIDER=gemini`
- Fallback rule-based vẫn dùng `ChatbotSalesAssistantService` khi Gemini lỗi, timeout, hết quota hoặc thiếu key, trừ khi `CHATBOT_LLM_FALLBACK_TO_RULE_BASED=false`.
- Env chatbot LLM:
  - `GEMINI_API_KEY`
  - `GEMINI_MODEL=gemini-2.5-flash`
  - `CHATBOT_LLM_PROVIDER=gemini`
  - `CHATBOT_LLM_ENABLED=true`
  - `CHATBOT_LLM_MAX_TOOL_CALLS=3`
  - `CHATBOT_LLM_TIMEOUT_MS=15000`
  - `CHATBOT_LLM_FALLBACK_TO_RULE_BASED=true`
- Tool `searchProducts` dùng `IChatbotProductCatalog`, giới hạn tối đa 4 sản phẩm để tiết kiệm quota và tránh câu trả lời dài.
- Gemini chỉ nên nói về sản phẩm lấy được từ tool, không bịa giá/tồn kho/khuyến mãi.
- Typecheck toàn server hiện vẫn fail bởi lỗi sẵn có ngoài phạm vi chatbot: mismatch Prisma generated client/node_modules client ở nhiều DI module và một số test mock cũ. Lọc lỗi theo `chatbot` chỉ còn lỗi Prisma DI dòng tạo `PrismaProductRepository(prisma)`, vốn là lỗi nền giống các module khác.

# Product Organization Assessment For AI Chatbox

- Hiện tại đủ để chatbot tận dụng ở Phase 1:
  - product catalog có category, color, size, usage occasion, price range và search.
  - adapter đã trả ảnh chính, giá thấp nhất, link sản phẩm, category slugs, usage occasions.
  - category hierarchy và `usage_occasions` phù hợp với website thời trang, không phải marketplace đa ngành.
- Còn thiếu để AI tư vấn tốt hơn:
  - metadata benefit/style chuẩn hóa: tôn dáng, co giãn, mát, ít nhăn, minimal, street, smart casual, feminine.
  - body-fit guidance: phù hợp dáng người, chiều cao, form rộng/ôm/regular rõ ràng.
  - seasonal/context tags: nắng nóng, mưa, du lịch, công sở, tiệc tối.
  - ranking signal riêng cho chatbot: impression/click/add-to-cart/conversion từ product cards trong chat.
  - admin lead inbox cho session `CONTACT_CAPTURED`, hiện mới lưu lead trong chat session.
  - tool chi tiết tiếp theo: `getProductDetail`, `suggestOutfit`, `getRelatedProducts`.

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

# Admin New Order Realtime + Sound Context

- Feature mới: admin nhận realtime notification khi có đơn hàng mới tạo thành công, kèm âm thanh ở `client-seller`.
- Luồng tạo order hiện tại nằm ở `server/src/module/payment/infrastructure/repositories/prisma-payment.repository.ts`
  - method `createPendingTransaction()`
  - đây là nơi tạo `order`, `orderItem`, `payment`, `paymentTransaction`, `auditLog` trong cùng Prisma transaction
  - `createPendingTransaction()` chỉ tạo pending order, không còn phát `NEW_ORDER`
  - `NEW_ORDER` hiện được phát trong luồng payment success sau khi PayOS xác nhận `PAID`
- Realtime admin hiện có sẵn và tiếp tục được tái sử dụng:
  - API SSE: `GET /api/admin/notifications/stream`
  - hub: `server/src/module/admin/notifications/infrastructure/realtime/admin-notification-hub.ts`
  - bảng lưu: `notifications`
  - frontend hook: `client-seller/src/hooks/use-admin-notifications.ts`
- Loại event mới:
  - SSE event name: `new_order`
  - payload có thêm metadata như `type`, `orderId`, `orderCode`, `customerName`, `totalAmount`, `paidAt`
- Backend processor mới:
  - file `server/src/module/admin/notifications/infrastructure/services/admin-new-order-notification.processor.ts`
  - chỉ gửi cho user có role `ADMIN`
  - có dedupe Redis key `notify:admin:new-order:{orderId}`
  - lưu notification DB + push SSE + ghi audit log `ADMIN_NEW_ORDER_NOTIFICATION_SENT`
- Điểm gọi `NEW_ORDER`:
  - RabbitMQ consumer `server/src/module/admin/notifications/infrastructure/consumers/admin-payment-success.consumer.ts`
  - notifier fallback `server/src/module/payment/infrastructure/notifiers/admin-payment-success.notifier.ts`
  - vì vậy nếu chưa `PAID` thì admin chưa thấy notification/sound `NEW_ORDER`
- Frontend admin sound:
  - hook mới `client-seller/src/hooks/use-admin-notification-sound.ts`
  - setting lưu `localStorage` key `aura-admin:new-order-sound-enabled`
  - phát âm thanh bằng file asset `/notification-sounds/universfield-new-notification-036-485897.mp3`
  - nếu browser chặn autoplay thì UI trong dropdown thông báo sẽ yêu cầu user bấm `Bật âm thanh`
- Header admin đã hỗ trợ:
  - toggle bật/tắt âm thanh
  - gợi ý bật âm thanh khi autoplay bị chặn
  - điều hướng notification `NEW_ORDER` về trang orders

# DB Cleanup Context

- Đợt cleanup DB ngày 2026-05-17 đã xóa 3 cột không còn dùng trong runtime:
  - `users.phone_verified`
  - `user_roles.assigned_at`
  - `discount_usages.used_at`
- Migration tương ứng: `server/prisma/migrations/20260517143000_remove_unused_columns/migration.sql`
- `npx prisma validate --schema prisma/schema.prisma` đã pass sau khi cập nhật schema.

- Đợt cleanup DB tiếp theo ngày 2026-05-17 đã xóa thêm 3 cột ở `products`:
  - `products.min_price`
  - `products.max_price`
  - `products.is_new`
- Migration tương ứng: `server/prisma/migrations/20260517150000_remove_unused_product_price_flags/migration.sql`
- Sau khi xóa:
  - API vẫn trả `minPrice` nhưng tính động từ variant thấp nhất hoặc `basePrice`
  - API vẫn giữ field `isNew` để không vỡ FE, nhưng hiện trả cố định `false`
  - recommendation/chatbot/public product repo đã bỏ mọi query trực tiếp vào `min_price` và `is_new`

# Chatbot AI Intent Router Context

- Refactor theo `traing.md`: nhánh LLM chatbot dùng Gemini intent classifier làm nguồn quyết định intent chính.
- Intent chính: `product_search`, `shop_question`, `fashion_advice`, `greeting`, `thanks`, `out_of_scope`.
- Port LLM mới có `classifyIntent()` trong `server/src/module/chatbot/applications/ports/output/chatbot-llm-client.ts`.
- Gemini REST client gọi classifier với JSON response trong `server/src/module/chatbot/infrastructure/llm/gemini-chat.client.ts`.
- Orchestrator mới ở `server/src/module/chatbot/applications/services/chatbot-llm-orchestrator.service.ts`:
  - classify intent trước
  - `product_search` dùng filters từ classifier để query `SearchProductsTool`
  - chỉ đưa sản phẩm thật từ DB vào prompt trả lời cuối
  - `shop_question` load markdown từ `server/src/module/chatbot/shop-knowledge`
  - classifier fail fallback về `out_of_scope` confidence 0, không crash
- Knowledge shop đã thêm:
  - `server/src/module/chatbot/shop-knowledge/policy.md`
  - `server/src/module/chatbot/shop-knowledge/shipping.md`
  - `server/src/module/chatbot/shop-knowledge/payment.md`
- Khi LLM router bật, `SendChatMessageUseCase` không fallback về rule-based keyword nữa; lỗi LLM ngoài dự kiến trả safe out-of-scope.
- Đã verify:
  - `npx tsc --noEmit`
  - chatbot tests: orchestrator, sales assistant fallback mode, chat session access
