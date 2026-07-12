# Speaker notes — AI Recommendation Aura Deep Dive

Các ghi chú dưới đây bám theo thứ tự slide.

## Slide 01 — AI Recommendation

Mở đầu: mục tiêu của bài không phải kể API nào trả danh sách, mà giải phẫu vì sao một candidate cụ thể nhận điểm, vượt qua bộ lọc và đứng đầu.

## Slide 02 — Câu hỏi trung tâm: vì sao sản phẩm này được gợi ý?

Giải thích sơ đồ/công thức trên slide, đối chiếu với pipeline thực tế và nêu trade-off kỹ thuật.

## Slide 03 — Kiến trúc triển khai thực tế

Giải thích sơ đồ/công thức trên slide, đối chiếu với pipeline thực tế và nêu trade-off kỹ thuật.

## Slide 04 — Dữ liệu đầu vào: một event không chỉ là một click

Giải thích sơ đồ/công thức trên slide, đối chiếu với pipeline thực tế và nêu trade-off kỹ thuật.

## Slide 05 — Ingestion đáng tin cậy: event đi qua RabbitMQ

Giải thích sơ đồ/công thức trên slide, đối chiếu với pipeline thực tế và nêu trade-off kỹ thuật.

## Slide 06 — Trọng số hành vi: giá trị kinh doanh được mã hóa thành số

Giải thích sơ đồ/công thức trên slide, đối chiếu với pipeline thực tế và nêu trade-off kỹ thuật.

## Slide 07 — Offline refresh: biến lịch sử thành artifacts phục vụ nhanh

Giải thích sơ đồ/công thức trên slide, đối chiếu với pipeline thực tế và nêu trade-off kỹ thuật.

## Slide 08 — Tạo document cho một sản phẩm

Giải thích sơ đồ/công thức trên slide, đối chiếu với pipeline thực tế và nêu trade-off kỹ thuật.

## Slide 09 — Encoder: MiniLM nếu tải được, hashing nếu không

Giải thích sơ đồ/công thức trên slide, đối chiếu với pipeline thực tế và nêu trade-off kỹ thuật.

## Slide 10 — Cosine similarity trong pgvector

Giải thích sơ đồ/công thức trên slide, đối chiếu với pipeline thực tế và nêu trade-off kỹ thuật.

## Slide 11 — Context vector: hệ thống hiểu 'gu hiện tại' như thế nào?

Giải thích sơ đồ/công thức trên slide, đối chiếu với pipeline thực tế và nêu trade-off kỹ thuật.

## Slide 12 — Công thức hybrid trong AI service

Giải thích sơ đồ/công thức trên slide, đối chiếu với pipeline thực tế và nêu trade-off kỹ thuật.

## Slide 13 — Candidate generation: không có một 'model duy nhất'

Giải thích sơ đồ/công thức trên slide, đối chiếu với pipeline thực tế và nêu trade-off kỹ thuật.

## Slide 14 — Feed Home: xu hướng + phiên anonymous + ý định tìm kiếm

Giải thích sơ đồ/công thức trên slide, đối chiếu với pipeline thực tế và nêu trade-off kỹ thuật.

## Slide 15 — Feed Product Detail: 'sản phẩm tương tự' được tạo thế nào?

Giải thích sơ đồ/công thức trên slide, đối chiếu với pipeline thực tế và nêu trade-off kỹ thuật.

## Slide 16 — Feed Cart: cross-sell từ nhiều sản phẩm context

Giải thích sơ đồ/công thức trên slide, đối chiếu với pipeline thực tế và nêu trade-off kỹ thuật.

## Slide 17 — Feed Personalized: pipeline đầy đủ nhất

Giải thích sơ đồ/công thức trên slide, đối chiếu với pipeline thực tế và nêu trade-off kỹ thuật.

## Slide 18 — Search intent: chuyển câu người dùng thành candidate

Giải thích sơ đồ/công thức trên slide, đối chiếu với pipeline thực tế và nêu trade-off kỹ thuật.

## Slide 19 — Co-occurrence: học quan hệ từ giỏ hàng đã mua

Giải thích sơ đồ/công thức trên slide, đối chiếu với pipeline thực tế và nêu trade-off kỹ thuật.

## Slide 20 — Merge scores trong Node: max thắng, nguồn phụ cộng 20%

Giải thích sơ đồ/công thức trên slide, đối chiếu với pipeline thực tế và nêu trade-off kỹ thuật.

## Slide 21 — Bộ lọc và guardrail trước khi hiển thị

Giải thích sơ đồ/công thức trên slide, đối chiếu với pipeline thực tế và nêu trade-off kỹ thuật.

## Slide 22 — Worked example #1: AI chọn candidate nào?

Giải thích sơ đồ/công thức trên slide, đối chiếu với pipeline thực tế và nêu trade-off kỹ thuật.

## Slide 23 — Worked example #2: sau merge, thứ hạng có thể đảo

Giải thích sơ đồ/công thức trên slide, đối chiếu với pipeline thực tế và nêu trade-off kỹ thuật.

## Slide 24 — End-to-end: một sản phẩm đi từ catalog đến vị trí #1

Giải thích sơ đồ/công thức trên slide, đối chiếu với pipeline thực tế và nêu trade-off kỹ thuật.

## Slide 25 — Cache hai tầng: tốc độ mà vẫn có khả năng phục hồi

Giải thích sơ đồ/công thức trên slide, đối chiếu với pipeline thực tế và nêu trade-off kỹ thuật.

## Slide 26 — Cache invalidation: freshness đến từ event

Giải thích sơ đồ/công thức trên slide, đối chiếu với pipeline thực tế và nêu trade-off kỹ thuật.

## Slide 27 — Fault tolerance: AI hỏng thì feed không nhất thiết hỏng

Giải thích sơ đồ/công thức trên slide, đối chiếu với pipeline thực tế và nêu trade-off kỹ thuật.

## Slide 28 — Observability: biết hệ thống nhanh hay chỉ 'có chạy'

Giải thích sơ đồ/công thức trên slide, đối chiếu với pipeline thực tế và nêu trade-off kỹ thuật.

## Slide 29 — Đánh giá chất lượng: offline metric chưa đủ

Giải thích sơ đồ/công thức trên slide, đối chiếu với pipeline thực tế và nêu trade-off kỹ thuật.

## Slide 30 — A/B testing đúng cách

Giải thích sơ đồ/công thức trên slide, đối chiếu với pipeline thực tế và nêu trade-off kỹ thuật.

## Slide 31 — Technical debt nhìn thẳng vào code

Giải thích sơ đồ/công thức trên slide, đối chiếu với pipeline thực tế và nêu trade-off kỹ thuật.

## Slide 32 — Roadmap kỹ thuật: từ heuristic hybrid đến ranking học được

Giải thích sơ đồ/công thức trên slide, đối chiếu với pipeline thực tế và nêu trade-off kỹ thuật.

## Slide 33 — Kịch bản demo kỹ thuật

Giải thích sơ đồ/công thức trên slide, đối chiếu với pipeline thực tế và nêu trade-off kỹ thuật.

## Slide 34 — Kết luận: recommendation là một chuỗi quyết định có thể kiểm chứng

Giải thích sơ đồ/công thức trên slide, đối chiếu với pipeline thực tế và nêu trade-off kỹ thuật.
