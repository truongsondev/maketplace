# Giải thích flow recommendation

Tài liệu này mô tả flow recommendation đang được triển khai trong repo, dựa trên code ở `client-next`, `server` và `ai-service`.

## 1. Tổng quan kiến trúc

Hệ thống recommendation gồm 3 lớp chính:

1. **Frontend `client-next`**
   - Hiển thị block gợi ý bằng `RecommendationShelf`.
   - Gọi API recommendation qua React Query.
   - Gửi tracking event cho impression/click và các hành vi mua sắm.

2. **Backend `server`**
   - Expose API dưới prefix `/api`.
   - Validate `sessionId`, `limit`, auth.
   - Chọn loại feed: `home`, `product`, `cart`, `personalized`.
   - Lấy dữ liệu recommendation từ Prisma/MySQL, Redis cache, AI service.
   - Lưu tracking event vào `recommendation_events`.
   - Refresh artifact định kỳ: `product_similarities`, cache, embedding/AI artifacts.

3. **AI service `ai-service`**
   - FastAPI service.
   - Nhận catalog + event từ backend qua `/train` và `/embed/products`.
   - Tạo embedding sản phẩm bằng `sentence-transformers/all-MiniLM-L6-v2` nếu load được, fallback sang hashing embedding.
   - Lưu/search vector trong PostgreSQL + pgvector.
   - Trả về gợi ý hybrid từ vector similarity + popularity qua `/recommend/hybrid`.

Flow rút gọn:

```text
UI RecommendationShelf
  -> client recommendationService
  -> GET /api/recommendations/...
  -> RecommendationAPI
  -> RecommendationController
  -> GetRecommendationFeedUseCase
  -> PrismaRecommendationRepository
  -> Redis cache / MySQL / AI service
  -> product cards
  -> UI render ProductCard
  -> trackingService.track impression/click
  -> POST /api/track
  -> recommendation_events + RabbitMQ + cache invalidation
```

## 2. Các điểm hiển thị trên frontend

Component dùng chung là `client-next/components/page/recommendation-shelf.tsx`.

`RecommendationShelf` nhận các prop quan trọng:

- `kind`: `home`, `product`, `cart`, `personalized`.
- `productId`: bắt buộc với `kind="product"`.
- `limit`: mặc định 8.
- `placement`: vị trí hiển thị, được gửi kèm tracking.
- `enabled`: bật/tắt query.
- `emptyMessage`: thông báo khi feed rỗng.

Các vị trí đang dùng:

- Trang home: `client-next/app/page.tsx`
  - Nếu đã đăng nhập: `kind="personalized"`, placement `home_personalized_recommendations`.
  - Nếu guest: `kind="home"`, placement `home_recommendations`.
- Trang chi tiết sản phẩm: `client-next/components/page/product/product-detail-content.tsx`
  - `kind="product"`, có `productId`, placement `product_detail_recommendations`.
- Trang giỏ hàng: `client-next/app/(page)/cart/page.tsx`
  - Chỉ hiển thị khi authenticated.
  - `kind="cart"`, placement `cart_recommendations`.
- Trang đơn hàng: `client-next/app/(page)/orders/orders-list-client.tsx`
  - Chỉ hiển thị khi authenticated.
  - `kind="personalized"`, placement `orders_personalized_recommendations`.
- Trang thank you sau checkout: `client-next/app/(page)/checkout/thank-you/thank-you-client.tsx`
  - Dùng `kind="personalized"`.

## 3. Session và query key trên frontend

Session id được quản lý trong `client-next/lib/session-id.ts`.

- Key localStorage: `aura_session_id`.
- Nếu browser đã có session id thì reuse.
- Nếu chưa có thì tạo bằng `crypto.randomUUID()` hoặc fallback `sess_${timestamp}_${random}`.
- Khi server render thì trả về chuỗi fallback `server-render-session`.

API recommendation luôn gửi `sessionId` bằng query param:

```text
GET api/recommendations/home?limit=8&sessionId=<session>
GET api/recommendations/product/:id?limit=8&sessionId=<session>
GET api/recommendations/cart?limit=8&sessionId=<session>
GET api/recommendations/personalized?limit=10&sessionId=<session>
```

React Query hooks nằm ở `client-next/hooks/use-recommendations.ts`.

Query key có version `v2` để tránh dùng lại cache cũ:

- Home: `["recommendations", "v2", "home", sessionId, limit]`
- Product: `["recommendations", "v2", "product", productId, sessionId, limit]`
- Cart: `["recommendations", "v2", "cart", user/guest marker, sessionId, limit]`
- Personalized: `["recommendations", "v2", "personalized", user/guest marker, sessionId, limit]`

Cart và personalized chỉ enabled khi user đã authenticated. Home và product có thể public.

## 4. API layer trên backend

Recommendation module được mount trong `server/src/app.ts`:

```text
app.use('/api', createRecommendationModule())
```

Routes nằm trong `server/src/module/recommendation/infrastructure/api/recommendation.api.ts`:

- `POST /api/track`
- `GET /api/recommendations/home`
- `GET /api/recommendations/product/:id`
- `GET /api/recommendations/cart`
- `GET /api/recommendations/personalized`
- `GET /api/analytics/recommendations`

Middleware auth cho phép public:

- `GET /api/recommendations/home`
- `GET /api/recommendations/product/:id`
- `POST /api/track`

Với public tracking, middleware cố gắng attach optional `userId` nếu request có bearer token hợp lệ. Cart và personalized bắt buộc có `req.userId`, nếu không sẽ trả lỗi `Authentication required`.

API validate:

- `sessionId` bắt buộc qua `x-session-id`, query `sessionId`, hoặc body `sessionId`; độ dài sau trim tối thiểu 4.
- `limit` phải là integer từ 1 đến 30.
- `eventType` tracking chỉ nhận các giá trị:
  - `VIEW_PRODUCT`
  - `ADD_TO_CART`
  - `REMOVE_FROM_CART`
  - `PURCHASE`
  - `SEARCH_QUERY`
  - `FAVORITE_PRODUCT`

## 5. Controller và usecase

`RecommendationController` gắn request API sang `GetRecommendationFeedUseCase`.

Mapping:

- `getHome(sessionId, limit)` -> `{ kind: "home", sessionId, limit }`
- `getProduct(productId, sessionId, limit)` -> `{ kind: "product", productId, sessionId, limit }`
- `getCart(userId, sessionId, limit)` -> `{ kind: "cart", userId, sessionId, limit }`
- `getPersonalized(userId, sessionId, limit)` -> `{ kind: "personalized", userId, sessionId, limit }`

`GetRecommendationFeedUseCase` chọn repository method theo `kind`, sau đó gọi `getProductCards(items)` để biến danh sách `{ productId, score, reason, source }` thành card UI.

Title và strategy trả về frontend:

| Kind | Title | Strategy |
| --- | --- | --- |
| `home` | `Xu hướng nổi bật` | `trending+top_viewed+top_purchased` |
| `product` | `Bạn có thể cũng thích` | `item_similarity+category_fallback` |
| `cart` | `Phối cùng giỏ hàng của bạn` | `cart_ai+category_fallback+cross_sell` |
| `personalized` | `Dành riêng cho bạn` | `recent_behavior+hybrid` |

Kết quả response có dạng:

```ts
{
  title: string;
  strategy: string;
  generatedAt: string;
  items: Array<ProductCard & {
    score: number;
    reason: string;
    source: string;
  }>;
}
```

## 6. Repository: flow tạo từng loại feed

Logic chính nằm trong `server/src/module/recommendation/infrastructure/repositories/prisma-recommendation.repository.ts`.

### 6.1 Home recommendations

Method: `getHomeRecommendations(limit, sessionId)`

Cache key:

```text
recommendations:home:v2:{sessionId}:{limit}
```

TTL: 900 giây.

Flow:

1. Đọc Redis cache. Nếu có cache hợp lệ thì trả về.
2. Lấy search intent trong 30 ngày gần nhất cho session anonymous:
   - Chỉ lấy event `SEARCH_QUERY`.
   - Nếu `anonymousSessionOnly=true` thì điều kiện session phải có `user_id IS NULL`.
   - Tìm product có `name` hoặc `description` match query.
   - Score xấp xỉ: `total_search_count * 3 - rankPenalty`.
3. Lấy event trong session 14 ngày gần nhất:
   - Chỉ lấy `VIEW_PRODUCT`, `ADD_TO_CART`, `FAVORITE_PRODUCT`.
   - Chỉ lấy `user_id IS NULL`, để guest session không bị trộn với user đã login.
   - Weight:
     - `ADD_TO_CART`: 3
     - `FAVORITE_PRODUCT`: 2.5
     - `VIEW_PRODUCT`: 1
     - Khác: 0.5
4. Merge search intent + session behavior bằng `mergeRecommendationScores`.
5. Nếu có item thì cache và trả về.
6. Nếu không có tín hiệu thì fallback sang sản phẩm mới/nổi bật:
   - Product không bị delete.
   - Có image.
   - Sắp xếp `isSale desc`, `createdAt desc`.
   - Reason: `Sản phẩm mới nổi bật`.
   - Source: `home_catalog_fallback`.

Ghi chú: strategy trả ra là `trending+top_viewed+top_purchased`, nhưng code hiện tại ưu tiên session/search intent rồi fallback catalog; Redis key global `recommendations:home:global:12` được refresh artifacts tạo ra nhưng feed home đang đọc key theo session.

### 6.2 Product recommendations

Method: `getProductRecommendations(productId, limit)`

Cache key:

```text
recommendations:product:{productId}:{limit}
```

TTL: 1800 giây.

Flow:

1. Đọc Redis cache.
2. Lấy item similarity từ bảng `product_similarities`:
   - Điều kiện `product_id = productId`.
   - Sắp xếp `score desc`.
   - Limit `limit * 2`.
   - Thường được tạo từ co-occurrence trong order items.
3. Gọi AI vector recommendation:
   - Context: `[productId]`.
   - Endpoint: `POST {AI_SERVICE_URL}/recommend/hybrid`.
   - Feed: `product`.
   - Item trả về được gắn:
     - Reason: `Tương đồng bằng pgvector` hoặc `Tương đồng embedding từ pgvector`.
     - Source: `pgvector`.
4. Lấy fallback cùng danh mục/cùng product type:
   - Cùng category trực tiếp, category cha, category con.
   - Nếu chưa đủ thì lấy cùng `productTypeId`.
5. Merge các nguồn:
   - AI vector.
   - `product_similarities`.
   - category/product type fallback.
6. Gọi `uniqueTop(..., excluded=[productId])` để loại sản phẩm đang xem và dedupe.
7. Cache và trả về.

### 6.3 Cart recommendations

Method: `getCartRecommendations(userId, limit)`

Cache key:

```text
recommendations:cart:{userId}:{limit}
```

TTL: 600 giây.

Flow:

1. Đọc Redis cache.
2. Lấy cart theo `userId` kèm `items`.
3. Nếu cart rỗng thì trả về `[]`.
4. Tạo danh sách excluded là product id trong giỏ.
5. Gọi AI vector recommendation:
   - Context là các sản phẩm trong giỏ.
   - Excluded cũng là các sản phẩm trong giỏ.
   - Reason: `AI gợi ý phù hợp với các sản phẩm trong giỏ`.
   - Source: `cart_ai`.
6. Lấy fallback cùng danh mục với các sản phẩm trong giỏ:
   - Reason: `Cùng danh mục với sản phẩm trong giỏ`.
   - Source: `cart_category_fallback`.
7. Lấy product recommendation riêng cho từng item trong giỏ, rồi flatten.
8. Gộp tất cả nguồn, dedupe, loại item đang có trong giỏ.
9. Cache và trả về.

### 6.4 Personalized recommendations

Method: `getPersonalizedRecommendations(userId, sessionId, limit)`

Cache key:

```text
recommendations:personalized:v4:{userId}:{sessionId}:{limit}
```

TTL: 900 giây.

Flow:

1. Đọc Redis cache.
2. Lấy recent events của user trong 45 ngày:
   - Chỉ lấy event có `product_id`.
   - Group theo product.
   - Weight:
     - `PURCHASE`: 4
     - `ADD_TO_CART`: 3
     - `FAVORITE_PRODUCT`: 2.5
     - `VIEW_PRODUCT`: 1
     - Khác: 0.5
   - Vì query đang filter `user_id = userId`, hệ số `* 1.35` luôn áp dụng cho chính user.
   - Limit 10 product context.
3. Lấy search intent theo `userId` trong 30 ngày.
4. Tạo `contextIds` từ recent events.
5. Gọi AI vector recommendation:
   - Context là `contextIds`.
   - Excluded cũng là `contextIds`.
   - Có gửi `user_id` sang AI service.
6. Với mỗi recent product, gọi `getProductRecommendations(productId, max(6, limit))` để lấy item liên quan.
7. Thêm own signals:
   - Product đã tương tác gần đây.
   - Score = event score * 1.2.
   - Reason: `Dựa trên hành vi gần đây của bạn`.
   - Source: `recent_behavior`.
8. Gộp các nguồn:
   - Search intent.
   - Own signals.
   - AI vector.
   - Related product recommendations.
9. `uniqueTop` để dedupe và lấy top `limit`.
10. Cache và trả về.

Lưu ý: personalized hiện tại có thể trả lại sản phẩm user đã tương tác gần đây vì own signals không bị excluded trong bước `uniqueTop`. AI vector thì exclude context ids.

## 7. Scoring và dedupe

Repository có 2 helper quan trọng.

`mergeRecommendationScores(items, limit)`:

- Duyệt danh sách item theo `productId`.
- Nếu product chưa có hoặc item mới có score cao hơn, giữ item mới.
- Nếu product đã có và item mới điểm thấp hơn, cộng thêm `item.score * 0.2` vào item hiện có.
- Sắp xếp `score desc`, cắt theo `limit`.

`uniqueTop(items, limit, excludedProductIds = [])`:

- Loại các product id nằm trong excluded.
- Sắp xếp `score desc`.
- Giữ bản ghi đầu tiên cho mỗi `productId`.
- Cắt theo `limit`.

Vì `uniqueTop` giữ item đầu tiên sau khi sort, reason/source của product sẽ đến từ nguồn có score cao nhất.

## 8. Chuyển product id thành card

Sau khi repository tạo danh sách recommendation item, usecase gọi `getProductCards(items)`.

Method này query bằng `prisma.product.findMany`:

- Chỉ lấy product `isDeleted=false`.
- Lấy:
  - `id`
  - `name`
  - `basePrice`
  - `isSale`
  - variant giá thấp nhất
  - image đầu tiên, ưu tiên `isPrimary desc`, sau đó `sortOrder asc`

Card trả về frontend:

```ts
{
  id,
  name,
  imageUrl,
  minPrice,
  isNew: false,
  isSale,
  score,
  reason,
  source
}
```

Nếu product không tồn tại hoặc đã bị delete thì bị filter khỏi response.

## 9. Tracking flow

Frontend tracking nằm trong `client-next/services/tracking.service.ts`.

Call:

```text
POST /api/track
Header: x-session-id: <session>
Body: {
  eventType,
  productId?,
  orderId?,
  searchQuery?,
  source?,
  placement?,
  occurredAt?,
  dedupeKey?,
  metadata?
}
```

Tracking là fire-and-forget:

- Lỗi API không block UX.
- `occurredAt` mặc định là thời điểm hiện tại.
- `x-session-id` luôn lấy từ `getSessionId()`.

`RecommendationShelf` gửi 2 loại event:

1. **Impression**
   - Trigger khi `items.length > 0`.
   - Event type: `VIEW_PRODUCT`.
   - `source`: `recommendation_impression`.
   - `placement`: prop placement.
   - `metadata.recommendationIds`: danh sách id đang hiện.
   - `metadata.strategy`: strategy feed.
   - Có `impressionKeyRef` để tránh gửi lặp cùng một placement + cùng danh sách item.

2. **Click vào recommendation card**
   - Event type: `VIEW_PRODUCT`.
   - `productId`: item id.
   - `source`: `recommendation_click`.
   - Metadata gồm `reason`, `strategy`, `score`.

Backend `/api/track`:

1. Lấy `sessionId` từ header/query/body.
2. Validate event type.
3. Tạo `dedupeKey`:
   - Nếu client gửi `dedupeKey` hoặc header `x-idempotency-key` thì dùng giá trị đó.
   - Nếu không, build từ `eventType:userId/guest:sessionId:target:occurredAt`.
   - Nếu quá 120 ký tự thì hash SHA-256 thành `trk:<hash>`.
4. Gọi `TrackRecommendationEventUseCase`.
5. Lưu DB qua `saveTrackingEvent`.
6. Publish event vào RabbitMQ.
7. Trả về HTTP 202.

`saveTrackingEvent` insert vào `recommendation_events`:

- `event_type`
- `user_id`
- `session_id`
- `product_id`
- `order_id`
- `search_query`
- `dedupe_key`
- `source`
- `placement`
- `metadata`
- `occurred_at`
- `processed_at`

Nếu trùng unique `dedupe_key`, backend trả `{ accepted: true, duplicated: true }` thay vì throw.

Sau khi lưu event:

- Tăng Prometheus counter `recommendation_events_total`.
- Cập nhật realtime Redis signals:
  - Sorted set `recommendations:hot-products`, weight:
    - `PURCHASE`: 5
    - `ADD_TO_CART`: 3
    - `FAVORITE_PRODUCT`: 2
    - Khác: 1
  - Nếu có `userId` + `productId`, push vào list `recommendations:recent:{userId}`, giữ 30 item, expire 30 ngày.
- Invalidate cache liên quan:
  - Theo session:
    - `recommendations:home:{sessionId}:*`
    - `recommendations:home:v2:{sessionId}:*`
    - `recommendations:personalized:*:{sessionId}:*`
  - Theo user:
    - `recommendations:cart:{userId}:*`
    - `recommendations:personalized:{userId}:*`
    - `recommendations:personalized:v2:{userId}:*`
    - `recommendations:personalized:v3:{userId}:*`
    - `recommendations:personalized:v4:{userId}:*`

## 10. RabbitMQ flow

`recommendation-event-bus.ts` cấu hình:

- Exchange: `recommendation.events`
- Routing key: `tracking.ingest`
- Queue chính: `recommendation_tracking_q`
- Retry queue: `recommendation_tracking_retry_q`
- DLX: `recommendation.events.dlx`
- DLQ: `recommendation_tracking_dlq`
- Retry TTL mặc định: 15000 ms.
- Max retries mặc định: 3.

Khi backend bootstrap recommendation module:

1. Start consumer một lần.
2. Consumer đọc event từ queue.
3. Handler gọi lại `trackEventUseCase.execute(event)`.
4. Nếu thành công thì ack.
5. Nếu lỗi và chưa quá max retries thì đẩy sang retry queue.
6. Nếu quá max retries thì nack để vào DLQ.

Lưu ý quan trọng: `/api/track` hiện tại vừa lưu trực tiếp vào DB, vừa publish RabbitMQ. Consumer sau đó cũng gọi save event. Cơ chế unique `dedupe_key` giúp lần consume thứ hai trở thành duplicated và không tạo bản ghi trùng.

## 11. Refresh artifacts

`server/src/module/recommendation/di.ts` gọi `bootstrapBackgroundWork`.

Background work gồm:

1. Start RabbitMQ consumer.
2. Chạy `refreshUseCase.execute()` ngay khi bootstrap.
3. Lặp lại theo `RECOMMENDATION_REFRESH_INTERVAL_MS`, mặc định 15 phút.

`refreshArtifacts()` làm 3 việc:

### 11.1 Refresh product similarities

Query `order_items` theo co-occurrence:

- Join `order_items` với chính nó theo cùng `order_id`.
- `oi1.product_id <> oi2.product_id`.
- Group theo cặp product.
- Score = `COUNT(*) * 1.0`.
- Xóa các dòng `product_similarities` có `algorithm='cooccurrence'`.
- Insert lại top 500 cặp.

Bảng này được feed product đọc để tạo gợi ý "tương đồng về hành vi mua sắm".

### 11.2 Sync AI artifacts

Lấy tối đa:

- 2000 product không delete.
- 5000 recommendation events gần nhất.

Product payload gửi sang AI:

```json
{
  "product_id": "...",
  "title": "...",
  "description": "...",
  "category": "...",
  "attributes": {
    "tags": ["..."]
  }
}
```

Event payload gửi sang AI:

```json
{
  "user_id": "...",
  "product_id": "...",
  "event_type": "...",
  "weight": 1 | 2 | 3 | 4
}
```

Weight:

- `PURCHASE`: 4
- `ADD_TO_CART`: 3
- `FAVORITE_PRODUCT`: 2
- Khác: 1

Backend gọi:

- `POST /train`
- `POST /embed/products`

### 11.3 Warm cache home global

Tạo fallback item bằng `getLatestProductsFallback(12, 'home_catalog_fallback')`, sau đó persist vào:

```text
recommendations:home:global:12
```

TTL: 3600 giây.

## 12. AI service và pgvector

AI service nằm ở `ai-service/app/main.py`.

Startup:

- Kết nối `VECTOR_DATABASE_URL`.
- Tạo extension `vector`.
- Tạo bảng `product_embeddings` nếu chưa có:
  - `product_id`
  - `title`
  - `category`
  - `embedding vector(384)` mặc định
  - `metadata`
  - `updated_at`
- Tạo index ivfflat cho cosine distance.

### 12.1 `/train`

Nhận `products` và `events`.

Xử lý:

- Lưu product vào in-memory store.
- Tạo vector cho từng product.
- Tính popularity theo event weight.
- Tính `user_preferences[user_id][product_id]` nếu event có user.

Model embedding:

- Ưu tiên `sentence-transformers/all-MiniLM-L6-v2`.
- Nếu không load được thì dùng hashing baseline.

### 12.2 `/embed/products`

Nhận products, tạo embedding, upsert vào bảng `product_embeddings` của vector DB.

Document text để embed gồm:

```text
title + description + category + attributes
```

### 12.3 `/recommend/hybrid`

Request từ backend:

```json
{
  "user_id": "...",
  "session_id": null,
  "context_product_ids": ["..."],
  "candidate_product_ids": [],
  "limit": 12
}
```

Flow:

1. Candidate mặc định là tất cả product trong in-memory store.
2. Context bắt đầu từ `context_product_ids`.
3. Nếu có `user_id`, thêm top 8 product trong `user_preferences[user_id]` vào context.
4. Lấy vector của context product.
5. Nếu có context vector:
   - Tính average vector.
   - Normalize.
   - Search pgvector bằng cosine distance.
   - Exclude context product ids.
6. Với mỗi candidate:
   - `vector_score`: điểm similarity từ pgvector.
   - `popularity_score`: `log1p(popularity[product_id])`.
   - `final_score = vector_score * 0.75 + popularity_score * 0.25`.
7. Sort `final_score desc`, cắt theo `limit`.
8. Trả về:

```json
{
  "generated_at": "...",
  "strategy": "pgvector_hybrid_content_popularity",
  "items": [
    {
      "product_id": "...",
      "score": 0.123,
      "vector_score": 0.1,
      "popularity_score": 0.2
    }
  ]
}
```

Backend chỉ dùng `product_id` và `score`, rồi gắn reason/source theo feed.

## 13. Cache và persistence

Có 2 nơi lưu cache:

1. **Redis**
   - Dùng để đọc nhanh trong runtime.
   - Key theo feed/user/session/product/limit.
   - TTL tùy feed:
     - Home: 900s.
     - Product: 1800s.
     - Cart: 600s.
     - Personalized: 900s.

2. **MySQL `recommendation_caches`**
   - Lưu song song khi `persistCache`.
   - Có `cache_key`, `model_kind`, `user_id`, `product_id`, `session_id`, `items_json`, `metadata`, `expires_at`.
   - Hiện tại code đọc cache từ Redis, không đọc fallback từ bảng `recommendation_caches`.

`persistCache` map feed sang `RecommendationModelKind`:

- Home -> `TRENDING`
- Product -> `ITEM_SIMILARITY`
- Cart -> `SESSION_BASED`
- Personalized -> `HYBRID`

## 14. Bảng dữ liệu liên quan

Trong Prisma schema:

### `recommendation_events`

Lưu hành vi user/session.

Index chính:

- `[eventType, occurredAt]`
- `[userId, occurredAt]`
- `[productId, occurredAt]`
- `[sessionId, occurredAt]`

`dedupeKey` là unique để tránh event trùng.

### `product_similarities`

Lưu quan hệ sản phẩm tương tự.

Primary key:

```text
(productId, relatedProductId, algorithm)
```

Được refresh từ order co-occurrence và đọc trong feed product.

### `recommendation_caches`

Lưu snapshot cache recommendation theo model kind.

### `product_embeddings`

Trong Prisma schema có model `ProductEmbedding` lưu embedding JSON trên DB chính, nhưng AI service hiện tại tạo bảng riêng `product_embeddings` trong vector DB PostgreSQL với type `vector(384)`. Flow recommendation đang dùng bảng pgvector của AI service.

## 15. Analytics và monitoring

API analytics:

```text
GET /api/analytics/recommendations?fromDate=...&toDate=...
```

Trả về:

- Tổng event.
- Số session unique.
- Số product views.
- Số purchases.
- Breakdown theo event type.
- Top 10 product có nhiều event.

Prometheus metrics trong repository:

- `recommendation_events_total`
- `recommendation_cache_hits_total`
- `recommendation_generation_latency_ms`
- `recommendation_ai_latency_ms`
- `recommendation_ai_fallback_total`

AI service cũng expose `/metrics`:

- `aura_ai_products_total`
- `aura_ai_popularity_events_total`

Grafana dashboard nằm ở `infra/grafana/dashboards/recommendation-overview.json`.

## 16. Luồng end-to-end theo từng case

### Guest vào home

```text
Home page
  -> RecommendationShelf(kind="home")
  -> GET /api/recommendations/home?sessionId=...
  -> backend lấy search/session anonymous signals
  -> nếu chưa có signal thì fallback latest sale/new products
  -> render cards
  -> gửi impression tracking
```

### User đăng nhập vào home

```text
Home page
  -> RecommendationShelf(kind="personalized")
  -> GET /api/recommendations/personalized?sessionId=...
  -> backend lấy recent events của user + search intent + AI vector + related products
  -> render cards
  -> gửi impression tracking
```

### Xem chi tiết sản phẩm

```text
Product detail
  -> RecommendationShelf(kind="product", productId)
  -> GET /api/recommendations/product/:id
  -> backend lấy pgvector similar + cooccurrence + category fallback
  -> exclude sản phẩm đang xem
  -> render cards
  -> click card sẽ track VIEW_PRODUCT source recommendation_click
```

### Xem giỏ hàng

```text
Cart page authenticated
  -> RecommendationShelf(kind="cart")
  -> GET /api/recommendations/cart
  -> backend lấy cart item ids
  -> AI vector theo cart context
  -> same-category fallback
  -> product recommendations cho từng item trong cart
  -> exclude sản phẩm đã có trong giỏ
  -> render cards
```

### Sau khi có interaction mới

```text
trackingService.track(...)
  -> POST /api/track
  -> insert recommendation_events
  -> update Redis hot/recent signals
  -> invalidate cache theo session/user
  -> publish RabbitMQ
  -> consumer consume lại, bị dedupe nếu trùng
  -> lần request recommendation tiếp theo sẽ tính lại feed mới
```

## 17. Các điểm cần lưu ý khi debug

- Nếu recommendation không đổi sau khi click/add-to-cart, kiểm tra Redis key có bị invalidate đúng pattern không.
- Home feed chỉ dùng session anonymous (`user_id IS NULL`) cho session behavior; user đã login nên xem personalized feed thay vì home.
- Cart/personalized yêu cầu auth. Nếu frontend không có token hợp lệ sẽ fail.
- AI service chỉ có context nếu `/train` và `/embed/products` đã được refresh thành công.
- Nếu AI service lỗi, backend fallback về category/cooccurrence/catalog và tăng metric `recommendation_ai_fallback_total`.
- Redis là nguồn đọc cache chính; bảng `recommendation_caches` chủ yếu lưu snapshot/observability.
- `product_similarities` chỉ cập nhật theo interval refresh, không realtime ngay sau order mới.
- Impression event trong `RecommendationShelf` có `eventType=VIEW_PRODUCT` nhưng không có `productId`; danh sách product nằm trong metadata `recommendationIds`.
