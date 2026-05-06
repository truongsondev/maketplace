# ROADMAP TRIỂN KHAI RECOMMENDATION AI CHI TIẾT

## Mục lục

1. Giai đoạn 0: Chuẩn bị dữ liệu và phạm vi
2. Giai đoạn 1: Tracking và chất lượng dữ liệu
3. Giai đoạn 2: Gợi ý nền tảng (Baseline Recommendation)
4. Giai đoạn 3: Hybrid Recommendation + Ranking theo ngữ cảnh
5. Giai đoạn 4: Cá nhân hóa realtime + A/B Testing
6. Giai đoạn 5: Tối ưu vận hành và mở rộng
7. Roadmap đề xuất cho mini project

---

## Giai đoạn 0: Chuẩn bị dữ liệu và phạm vi

### 1. Mục tiêu chính

Xác định rõ mục tiêu kinh doanh, phạm vi hiển thị, và những dữ liệu tối thiểu cần có để hệ thống gợi ý hoạt động đúng hướng.

### 2. Vì sao cần giai đoạn này

Nếu bỏ qua, đội triển khai sẽ đo sai KPI, tracking thiếu sự kiện quan trọng, và mô hình gợi ý có thể lệch mục tiêu (ví dụ tối ưu click nhưng không tăng mua).

### 3. Input cần có

- BRD/PRD cho gợi ý sản phẩm.
- Danh sách vị trí hiển thị (trang chủ, danh mục, chi tiết, giỏ hàng).
- Danh sách sự kiện hành vi và thuộc tính tối thiểu.
- Danh mục thuộc tính sản phẩm (giá, tồn kho, khuyến mãi, danh mục).

### 4. Công việc cần thực hiện

- Business Analyst: chốt KPI (CTR, CVR, AOV), phạm vi người dùng (đăng nhập/ẩn danh), vị trí hiển thị.
- Backend: rà soát nguồn dữ liệu hiện có, ước lượng khả năng thu thập sự kiện.
- Frontend: đánh giá điểm chèn tracking, vị trí UI, khả năng hiển thị block gợi ý.
- Database: xác định bảng/sơ đồ dữ liệu sản phẩm và hành vi người dùng.
- AI/ML: đề xuất dữ liệu tối thiểu cho baseline, định nghĩa cold-start.
- DevOps: đánh giá tài nguyên lưu trữ và pipeline dự kiến.

### 5. AI / thuật toán sử dụng

Chưa dùng AI ở giai đoạn này. Đây là phần thiết kế nền tảng cho dữ liệu và phạm vi.

### 6. Output của giai đoạn

- Tài liệu tracking spec v1.
- Danh sách thuộc tính sản phẩm và mapping dữ liệu.
- Phạm vi hiển thị và KPI đã chốt.

### 7. Tiêu chí hoàn thành

- KPI được thống nhất và có cách đo.
- Tracking spec có đủ sự kiện cốt lõi.
- Đã xác nhận dữ liệu sản phẩm có thể truy xuất.

### 8. Rủi ro thường gặp

- KPI mơ hồ hoặc mâu thuẫn.
- Thiếu dữ liệu sản phẩm (ví dụ thiếu tồn kho hoặc khuyến mãi).
- Không thống nhất phạm vi hiển thị giữa BA và FE.

### 9. Ví dụ minh họa

Website bán quần áo muốn tăng AOV. Giai đoạn 0 chốt rằng block gợi ý ưu tiên sản phẩm bổ sung (phụ kiện) và KPI chính là AOV, không chỉ CTR.

### 10. Gợi ý công nghệ triển khai

- Frontend: Next.js
- Backend: Node.js/Express
- Database: MySQL
- Cache: Redis
- AI Service: Python (chuẩn bị sau)
- Message Queue: RabbitMQ (dự kiến)
- Deployment: Docker

---

## Giai đoạn 1: Tracking và chất lượng dữ liệu

### 1. Mục tiêu chính

Thu thập sự kiện hành vi người dùng ổn định và kiểm soát chất lượng dữ liệu để phục vụ gợi ý.

### 2. Vì sao cần giai đoạn này

Không có dữ liệu hành vi thì mô hình gợi ý chỉ còn dựa vào rule-based. Dữ liệu lỗi sẽ làm mô hình học sai (ví dụ sản phẩm bị click ảo).

### 3. Input cần có

- Tracking spec v1.
- Hệ thống log/ingest sự kiện.
- Schema dữ liệu lưu trữ (events, users, products).

### 4. Công việc cần thực hiện

- Business Analyst: kiểm thử tracking theo kịch bản thực tế.
- Backend: xây API nhận sự kiện, đảm bảo idempotent và chống spam.
- Frontend: gắn tracking vào view, search, add-to-cart, purchase.
- Database: thiết kế bảng events, chuẩn hóa session_id, user_id.
- AI/ML: định nghĩa feature cơ bản (lượt xem gần đây, tần suất mua).
- DevOps: pipeline ingest, giám sát độ trễ và tỉ lệ thiếu.

### 5. AI / thuật toán sử dụng

Chưa dùng AI. Có thể dùng rule-based để thống kê cơ bản (top view, top add-to-cart).

### 6. Output của giai đoạn

- Dữ liệu hành vi ổn định.
- Dashboard chất lượng dữ liệu (tỉ lệ thiếu, độ trễ).

### 7. Tiêu chí hoàn thành

- Độ trễ ingest < 15 phút (batch) hoặc < 1 phút (near real-time).
- Tỉ lệ thiếu sự kiện < 2%.
- 100% sự kiện có đủ user_id hoặc session_id.

### 8. Rủi ro thường gặp

- Trùng sự kiện do retry không idempotent.
- Sự kiện thiếu thuộc tính (ví dụ thiếu product_id).
- Lệch timestamp do time zone.

### 9. Ví dụ minh họa

Người dùng xem áo thun và thêm vào giỏ. Nếu sự kiện AddToCart không gửi product_id thì gợi ý cross-sell sẽ sai.

### 10. Gợi ý công nghệ triển khai

- Frontend: Next.js (tracking hooks)
- Backend: Node.js/Express (event collector)
- Database: MySQL (events), Redis (buffer/cache)
- Message Queue: RabbitMQ
- Deployment: Docker

---

## Giai đoạn 2: Gợi ý nền tảng (Baseline Recommendation)

### 1. Mục tiêu chính

Ra mắt gợi ý cơ bản để kiểm chứng giá trị kinh doanh nhanh, với chi phí thấp.

### 2. Vì sao cần giai đoạn này

Nếu bỏ qua, bạn sẽ nhảy thẳng vào mô hình phức tạp mà chưa có baseline để so sánh hiệu quả.

### 3. Input cần có

- Dữ liệu hành vi đã sạch (view, add-to-cart, purchase).
- Danh mục sản phẩm và thuộc tính cơ bản.
- Quy tắc loại trừ (không gợi ý sản phẩm đang xem).

### 4. Công việc cần thực hiện

- Business Analyst: định nghĩa KPI baseline, vị trí hiển thị ưu tiên.
- Backend: xây service gợi ý trending và item-item đơn giản.
- Frontend: hiển thị block gợi ý, xử lý fallback khi API lỗi.
- Database: tạo bảng tổng hợp (top products theo 7 ngày).
- AI/ML: thiết kế rule-based và item-item (co-view).
- DevOps: cache danh sách gợi ý, tối ưu thời gian phản hồi.

### 5. AI / thuật toán sử dụng

- Rule-based: top view, top purchase trong 7 ngày.
- Item-item đơn giản (co-view): sản phẩm thường được xem chung.
- Khi nào dùng: khi dữ liệu còn ít, cần kết quả nhanh.
- Ưu điểm: dễ triển khai, dễ giải thích.
- Nhược điểm: cá nhân hóa yếu, dễ lặp sản phẩm phổ biến.

### 6. Output của giai đoạn

- API gợi ý baseline.
- UI block gợi ý ở trang chủ và chi tiết sản phẩm.

### 7. Tiêu chí hoàn thành

- CTR tăng so với danh sách tĩnh.
- P95 latency < 400ms.
- Có log feedback (click, add-to-cart).

### 8. Rủi ro thường gặp

- Sản phẩm hết hàng vẫn được gợi ý.
- Dữ liệu bị bias bởi chiến dịch quảng cáo.
- Gợi ý lặp quá nhiều trên các vị trí.

### 9. Ví dụ minh họa

Trang chi tiết áo sơ mi hiển thị gợi ý "khách thường mua kèm" là quần tây và thắt lưng dựa trên co-view.

### 10. Gợi ý công nghệ triển khai

- Backend: Node.js/Express
- Database: MySQL (bảng tổng hợp)
- Cache: Redis (top list)
- AI Service: Python (tùy chọn)

---

## Giai đoạn 3: Hybrid Recommendation + Ranking theo ngữ cảnh

### 1. Mục tiêu chính

Nâng chất lượng gợi ý bằng cách kết hợp collaborative + content-based và xếp hạng theo ngữ cảnh.

### 2. Vì sao cần giai đoạn này

Nếu không có hybrid, hệ thống sẽ bị cold-start và không tận dụng được thuộc tính sản phẩm để cá nhân hóa.

### 3. Input cần có

- Dữ liệu hành vi đủ dày (>= 3-6 tháng).
- Thuộc tính sản phẩm đầy đủ (brand, price, category, size).
- Dữ liệu tồn kho, khuyến mãi.

### 4. Công việc cần thực hiện

- Business Analyst: xác định logic ranking theo ngữ cảnh (giá, tồn kho, khuyến mãi).
- Backend: triển khai pipeline feature, service hybrid.
- Frontend: mở rộng vị trí hiển thị (danh mục, giỏ hàng).
- Database: bảng feature và embedding (nếu có).
- AI/ML: xây content-based và collaborative filtering, kết hợp hybrid.
- DevOps: batch training định kỳ, theo dõi drift.

### 5. AI / thuật toán sử dụng

- Collaborative Filtering (item-item, user-user).
- Content-based (dựa trên thuộc tính sản phẩm).
- Hybrid: trộn điểm (weighted sum).
- Khi nào dùng: đã có dữ liệu đủ dày.
- Ưu điểm: cân bằng cá nhân hóa và khả năng giải thích.
- Nhược điểm: cần dữ liệu sạch, tuning phức tạp.

### 6. Output của giai đoạn

- Mô hình hybrid hoạt động ổn định.
- Ranking có thể cấu hình theo ngữ cảnh.

### 7. Tiêu chí hoàn thành

- CVR từ gợi ý tăng so với baseline.
- Tỉ lệ sản phẩm hết hàng được gợi ý < 1%.
- Tỉ lệ lặp sản phẩm trên cùng một phiên < 10%.

### 8. Rủi ro thường gặp

- Feature leakage (dùng dữ liệu tương lai).
- Overfit theo mùa (sale, lễ Tết).
- Ranking bias làm giảm đa dạng sản phẩm.

### 9. Ví dụ minh họa

Người dùng hay mua áo khoác mùa đông. Gợi ý ưu tiên áo khoác mới, kèm khăn và găng tay dựa trên thuộc tính và lịch sử mua.

### 10. Gợi ý công nghệ triển khai

- AI Service: Python (scikit-learn, implicit)
- Search/Vector: FAISS hoặc Elastic
- Backend: Node.js/Express (gọi dịch vụ AI)
- Cache: Redis

---

## Giai đoạn 4: Cá nhân hóa realtime + A/B Testing

### 1. Mục tiêu chính

Cá nhân hóa theo phiên (session-based) và triển khai A/B testing để đo hiệu quả mô hình.

### 2. Vì sao cần giai đoạn này

Không có realtime personalization, gợi ý sẽ chậm phản ứng theo hành vi mới. Không có A/B testing thì khó chứng minh giá trị mô hình.

### 3. Input cần có

- Event streaming (near real-time).
- Hạ tầng A/B testing (bucket người dùng).
- Hệ thống cache và feature store.

### 4. Công việc cần thực hiện

- Business Analyst: thiết kế thí nghiệm (nhóm test/control, KPI).
- Backend: phân nhóm người dùng, cache theo phiên.
- Frontend: hiển thị theo bucket, tracking kết quả.
- Database: lưu kết quả A/B testing, log impression.
- AI/ML: session-based model hoặc re-ranking realtime.
- DevOps: tối ưu latency, autoscale.

### 5. AI / thuật toán sử dụng

- Session-based recommendation (RNN/Transformer nhẹ) hoặc re-ranking theo hành vi gần nhất.
- Khi nào dùng: khi cần phản ứng theo hành vi trong phiên.
- Ưu điểm: tăng CTR nhanh.
- Nhược điểm: phức tạp, đòi hỏi hạ tầng realtime.

### 6. Output của giai đoạn

- Cá nhân hóa realtime hoạt động.
- Hệ thống A/B testing có báo cáo.

### 7. Tiêu chí hoàn thành

- P95 latency < 300ms.
- A/B test cho thấy cải thiện CTR hoặc CVR.
- Có cơ chế rollback khi mô hình kém.

### 8. Rủi ro thường gặp

- Bucket phân nhóm sai gây sai số thống kê.
- Cache stale làm gợi ý lỗi thời.
- Latency tăng khi traffic cao.

### 9. Ví dụ minh họa

Trong phiên, người dùng vừa xem 3 mẫu váy. Gợi ý realtime ưu tiên váy cùng phong cách thay vì danh sách trending.

### 10. Gợi ý công nghệ triển khai

- Streaming: Kafka hoặc RabbitMQ
- Feature store: Redis
- AI Service: Python (Torch, LightGBM re-rank)
- Backend: Node.js/Express

---

## Giai đoạn 5: Tối ưu vận hành và mở rộng

### 1. Mục tiêu chính

Ổn định vận hành, tự động huấn luyện lại và mở rộng sang phân khúc mới.

### 2. Vì sao cần giai đoạn này

Nếu không có giám sát drift và quy trình rollback, chất lượng gợi ý sẽ giảm dần theo thời gian.

### 3. Input cần có

- Lịch huấn luyện định kỳ.
- Dashboard theo dõi drift và KPI.
- Playbook xử lý sự cố.

### 4. Công việc cần thực hiện

- Business Analyst: chuẩn hóa báo cáo KPI dài hạn.
- Backend: versioning model, API rollback.
- Frontend: hỗ trợ hiển thị theo segment mới.
- Database: lưu version model và log KPI.
- AI/ML: pipeline retrain, kiểm tra drift.
- DevOps: CI/CD cho model, giám sát hạ tầng.

### 5. AI / thuật toán sử dụng

- Continuous training (tự động huấn luyện lại).
- Drift detection (phát hiện lệch dữ liệu).
- Khi nào dùng: khi dữ liệu thay đổi nhanh theo mùa.
- Ưu điểm: duy trì chất lượng lâu dài.
- Nhược điểm: cần giám sát chặt, tốn tài nguyên.

### 6. Output của giai đoạn

- Hệ thống vận hành ổn định.
- Quy trình retrain và rollback chuẩn hóa.

### 7. Tiêu chí hoàn thành

- KPI duy trì ổn định qua nhiều tháng.
- Thời gian rollback < 15 phút.
- Có cảnh báo drift tự động.

### 8. Rủi ro thường gặp

- Retrain sai dữ liệu gây giảm hiệu quả.
- Không kiểm soát version model.
- Thiếu monitoring dẫn đến suy giảm kéo dài.

### 9. Ví dụ minh họa

Hệ thống tự huấn luyện lại trước mùa sale. Nếu CTR giảm > 5%, tự động rollback về model trước.

### 10. Gợi ý công nghệ triển khai

- ML Ops: MLflow
- Monitoring: Prometheus + Grafana
- Deployment: Docker + CI/CD

---

## Roadmap đề xuất cho mini project

### Phiên bản đơn giản nhất nên làm trước

- Bắt buộc: Giai đoạn 0, 1, 2.
- Có thể fake/mock: Giai đoạn 3 (dùng rule-based thay hybrid), Giai đoạn 4 (mock A/B testing).
- Nâng cấp sau: Giai đoạn 3 full hybrid, Giai đoạn 4 realtime, Giai đoạn 5 vận hành chuẩn.

### Kiến trúc hệ thống đề xuất

- Frontend (Next.js): hiển thị block gợi ý và tracking sự kiện.
- Backend (Node.js/Express): API gợi ý, event collector.
- Database (MySQL): lưu events, products, aggregates.
- Cache (Redis): lưu danh sách top/trending.
- AI Service (Python): xử lý batch gợi ý (tùy chọn).
- Message Queue (RabbitMQ): ingest sự kiện.

### API recommendation mẫu

```http
GET /api/recommendations?user_id=123&context=product_detail&product_id=456&limit=8

Response:
{
	"context": "product_detail",
	"items": [
		{"product_id": 789, "score": 0.82, "reason": "co_view"},
		{"product_id": 234, "score": 0.76, "reason": "trending"}
	]
}
```

### Flow dữ liệu từ user action đến recommendation

1. User action (view/add-to-cart/purchase) -> Frontend gửi event.
2. Event -> Backend collector -> RabbitMQ.
3. Batch job tổng hợp -> bảng aggregates.
4. API recommendation đọc aggregates + rule-based.
5. Frontend hiển thị và gửi feedback.
