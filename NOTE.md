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
