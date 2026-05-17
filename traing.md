# FULLSTACK AI CHATBOT INTENT ROUTER IMPLEMENTATION PROMPT

## ROLE

Bạn là Senior AI Fullstack Engineer chuyên về:

- Node.js
- TypeScript
- Clean Architecture
- LLM Orchestration
- Gemini API
- AI Intent Classification
- Prompt Engineering
- RAG
- E-commerce chatbot systems

Bạn có khả năng:

- Thiết kế AI orchestration chuẩn production
- Tách intent classification khỏi business logic
- Tối ưu token usage và giảm hallucination
- Thiết kế AI routing pipeline
- Viết structured JSON response từ LLM
- Thiết kế hệ thống chatbot e-commerce thực tế

---

# OBJECTIVE

Refactor chatbot hiện tại của AURA.

Hiện tại chatbot đang detect intent bằng keyword hardcode như:

- hasFashionShoppingIntent()
- isGreeting()
- isThanks()

Cách này không đủ thông minh và khó scale.

Tôi muốn chuyển toàn bộ sang AI Intent Router dùng Gemini.

---

# NEW ARCHITECTURE

Flow mới phải hoạt động như sau:

User Message
↓
Gemini Intent Classifier
↓
Return Structured JSON
↓
Backend Router
├── product_search → query DB products
├── shop_question → answer from markdown knowledge
├── fashion_advice → AI stylist response
├── greeting / thanks → simple AI response
└── out_of_scope → reject politely

---

# REQUIRED INTENTS

Tạo intent system gồm:

```ts
type ChatIntent =
  | "product_search"
  | "shop_question"
  | "fashion_advice"
  | "greeting"
  | "thanks"
  | "out_of_scope";
```

---

# PRODUCT SEARCH REQUIREMENT

Nếu user đang muốn tìm/mua/gợi ý sản phẩm:

Ví dụ:

- "Mình cần áo sơ mi đỏ size M"
- "Tìm outfit đi chơi dưới 500k"
- "Có quần jean đen không?"
- "Da ngăm nên mặc gì đi tiệc?"

Gemini phải:

1. Detect intent = product_search
2. Extract filters structured JSON

Ví dụ output:

```json
{
  "intent": "product_search",
  "confidence": 0.95,
  "filters": {
    "keyword": "áo sơ mi",
    "category": "shirt",
    "color": "đỏ",
    "size": "M",
    "budgetMin": null,
    "budgetMax": 500000,
    "occasion": "đi chơi",
    "style": null,
    "gender": null
  }
}
```

Backend phải dùng filters này để query database thật.

KHÔNG được hardcode keyword detection nữa.

---

# SHOP QUESTION REQUIREMENT

Nếu user hỏi về:

- đổi trả
- vận chuyển
- thanh toán
- địa chỉ shop
- thời gian giao hàng
- COD
- chính sách bảo hành

Intent phải là:

```json
{
  "intent": "shop_question"
}
```

Lúc này backend sẽ:

1. Load markdown knowledge file
2. Inject markdown content vào Gemini
3. Gemini trả lời dựa trên markdown

Ví dụ:

```txt
/shop-knowledge/policy.md
/shop-knowledge/shipping.md
/shop-knowledge/payment.md
```

KHÔNG được hallucinate thông tin ngoài markdown.

---

# FASHION ADVICE REQUIREMENT

Nếu user hỏi tư vấn thời trang nhưng chưa muốn tìm sản phẩm cụ thể:

Ví dụ:

- "Da ngăm nên mặc màu gì?"
- "Đi phỏng vấn nên mặc gì?"
- "Nam thấp nên phối đồ sao?"

Intent:

```json
{
  "intent": "fashion_advice"
}
```

Gemini sẽ đóng vai stylist AI trả lời.

Sau đó có thể CTA nhẹ:

```txt
Bạn muốn mình gợi ý vài mẫu phù hợp trong shop không?
```

---

# GREETING / THANKS REQUIREMENT

Ví dụ:

- hello
- xin chào
- cảm ơn

Intent:

- greeting
- thanks

Cho AI trả lời ngắn gọn tự nhiên.

---

# OUT OF SCOPE REQUIREMENT

Nếu user hỏi không liên quan:

Ví dụ:

- code
- crypto
- toán học
- chính trị
- sex
- vũ khí

Intent:

```json
{
  "intent": "out_of_scope"
}
```

Response:

```txt
Mình chỉ là trợ lý AI của AURA, hiện mình chỉ hỗ trợ tư vấn thời trang và sản phẩm trong shop. Bạn vui lòng không hỏi nội dung ngoài phạm vi này nhé.
```

---

# IMPLEMENTATION REQUIREMENTS

nếu Gemini SDK hỗ trợ.

---

# 4. REMOVE OLD LOGIC

Xóa dependency vào:

- hasFashionShoppingIntent()
- detectSimpleChatbotIntent()
- keyword regex routing

Chỉ giữ fallback nếu AI classifier fail.

---

# 5. BACKEND ROUTER

Router flow:

```ts
switch (intent.intent) {
  case 'product_search':
    ...
  case 'shop_question':
    ...
  case 'fashion_advice':
    ...
  case 'greeting':
    ...
  case 'thanks':
    ...
  case 'out_of_scope':
    ...
}
```

---

# 6. PRODUCT SEARCH FLOW

Flow chuẩn:

User
↓
Gemini extract filters
↓
Backend query DB
↓
Pass real products back to Gemini
↓
Gemini generate final response
↓
Return to client

Gemini KHÔNG được tự bịa sản phẩm.

---

# 9. ERROR HANDLING

Nếu Gemini classifier fail:

Fallback:

```json
{
  "intent": "out_of_scope",
  "confidence": 0
}
```

Không được crash chatbot.

---

# 10. CODE QUALITY

Yêu cầu:

- Clean Architecture
- SOLID
- Typed strictly
- No any
- Reusable services
- Scalable orchestration
- Production-ready
- No duplicated prompts
- Dependency Injection compatible

---

# 11. IMPORTANT

- Không dùng keyword hardcode làm logic chính.
- AI classifier phải là nguồn quyết định intent duy nhất.
- Product recommendation phải luôn dựa trên DB thật.
- Shop information phải luôn dựa trên markdown knowledge.
- Không hallucinate sản phẩm, giá, tồn kho, chính sách.

---

# EXPECTED RESULT

Sau khi hoàn thành:

Chatbot có thể:

- hiểu ý định người dùng tự nhiên
- extract filter thông minh
- route đúng flow
- query sản phẩm thật
- trả lời chính sách shop bằng knowledge base
- từ chối câu hỏi ngoài phạm vi
- hoạt động như AI sales assistant thực tế

# NOTE

Ghi nhớ context vào NOTE.md quên thì vào đó đọc lại đẻ làm tiếp
