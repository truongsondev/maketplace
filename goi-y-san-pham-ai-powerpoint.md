# Gợi ý sản phẩm bằng AI trong dự án

## 1. Mục tiêu của chức năng gợi ý sản phẩm

Chức năng gợi ý sản phẩm giúp website đề xuất các sản phẩm có khả năng phù hợp với nhu cầu, sở thích và ngữ cảnh mua sắm của người dùng.

Ví dụ:

- Người dùng đang xem một chiếc áo thun, hệ thống gợi ý các sản phẩm tương tự hoặc dễ phối cùng.
- Người dùng đã xem nhiều sản phẩm công sở, hệ thống ưu tiên gợi ý các sản phẩm cùng phong cách.
- Người dùng thêm sản phẩm vào giỏ hàng, hệ thống gợi ý thêm sản phẩm liên quan để tăng khả năng mua kèm.

## 2. Vì sao AI có thể đưa ra sản phẩm phù hợp?

AI có thể đưa ra gợi ý phù hợp vì hệ thống không chỉ lấy sản phẩm ngẫu nhiên, mà dựa trên nhiều nguồn dữ liệu:

- Thông tin sản phẩm: tên, mô tả, danh mục, thuộc tính, màu sắc, kích cỡ, mục đích sử dụng.
- Hành vi người dùng: xem sản phẩm, tìm kiếm, thêm vào giỏ hàng, yêu thích, mua hàng.
- Độ tương đồng giữa các sản phẩm: sản phẩm nào có nội dung, danh mục hoặc đặc điểm gần giống nhau.
- Độ phổ biến: sản phẩm được nhiều người xem, mua hoặc tương tác sẽ có điểm ưu tiên cao hơn.
- Ngữ cảnh hiện tại: người dùng đang ở trang chủ, trang chi tiết sản phẩm, giỏ hàng hay trang đơn hàng.

Nhờ kết hợp các dữ liệu này, hệ thống có thể hiểu được người dùng đang quan tâm đến nhóm sản phẩm nào và chọn ra các sản phẩm gần với nhu cầu đó.

## 3. Nguyên tắc hoạt động tổng quát

Hệ thống recommendation hoạt động theo mô hình hybrid recommendation, tức là kết hợp nhiều phương pháp gợi ý:

- Content-based recommendation: gợi ý dựa trên nội dung và đặc điểm sản phẩm.
- Behavior-based recommendation: gợi ý dựa trên hành vi người dùng.
- Popularity-based recommendation: gợi ý dựa trên độ phổ biến của sản phẩm.
- Similarity recommendation: gợi ý các sản phẩm tương tự sản phẩm đang xem.

Luồng tổng quát:

1. Website ghi nhận hành vi người dùng.
2. Backend lưu hành vi vào bảng `recommendation_events`.
3. Backend tổng hợp dữ liệu sản phẩm và hành vi.
4. AI service tạo vector embedding cho sản phẩm.
5. Khi cần gợi ý, hệ thống tìm các sản phẩm có vector gần nhau.
6. Backend kết hợp điểm tương đồng, độ phổ biến và ngữ cảnh.
7. Danh sách gợi ý được trả về frontend và hiển thị cho người dùng.

## 4. Embedding là gì?

Embedding là cách AI biến thông tin sản phẩm thành một vector số.

Ví dụ một sản phẩm có dữ liệu:

- Tên: Áo thun cotton nam
- Mô tả: Chất liệu cotton, thoáng mát, phù hợp đi chơi
- Danh mục: Áo
- Thuộc tính: màu trắng, size M, phong cách casual

AI sẽ chuyển toàn bộ thông tin này thành một vector nhiều chiều. Các sản phẩm có nội dung giống nhau sẽ có vector nằm gần nhau trong không gian vector.

Nhờ vậy, khi người dùng xem một sản phẩm, hệ thống có thể tìm các sản phẩm có vector gần nhất để gợi ý.

## 5. AI tìm sản phẩm tương tự như thế nào?

AI service sử dụng PostgreSQL kết hợp pgvector để lưu và tìm kiếm vector sản phẩm.

Cách hoạt động:

1. Mỗi sản phẩm được tạo một embedding vector.
2. Vector được lưu vào bảng `product_embeddings`.
3. Khi cần gợi ý, hệ thống lấy vector của sản phẩm hoặc nhóm sản phẩm người dùng quan tâm.
4. AI tính khoảng cách giữa vector đó với các vector sản phẩm khác.
5. Sản phẩm có khoảng cách gần nhất được xem là sản phẩm tương tự nhất.

Nói đơn giản: sản phẩm càng giống nhau về nội dung, đặc điểm và ngữ cảnh sử dụng thì vector càng gần nhau, khả năng được gợi ý càng cao.

## 6. Hệ thống dùng hành vi người dùng như thế nào?

Mỗi hành vi của người dùng được xem là một tín hiệu sở thích.

Một số hành vi quan trọng:

- Xem sản phẩm: người dùng có quan tâm.
- Thêm vào giỏ hàng: mức quan tâm cao hơn.
- Yêu thích sản phẩm: người dùng có ý định lưu lại.
- Mua hàng: tín hiệu mạnh nhất.
- Tìm kiếm: thể hiện nhu cầu trực tiếp.

Các hành vi này được lưu trong bảng `recommendation_events`.

Từ đó, hệ thống có thể suy ra:

- Người dùng thích nhóm sản phẩm nào.
- Người dùng quan tâm màu sắc, phong cách hoặc danh mục nào.
- Sản phẩm nào đang phổ biến.
- Sản phẩm nào thường được xem hoặc mua cùng nhau.

## 7. Cách tính điểm gợi ý

Một sản phẩm được đề xuất dựa trên nhiều loại điểm:

- Điểm tương đồng nội dung: sản phẩm có giống sản phẩm người dùng đang xem không.
- Điểm hành vi: người dùng từng xem, thích hoặc mua nhóm sản phẩm liên quan chưa.
- Điểm phổ biến: sản phẩm có được nhiều người tương tác không.
- Điểm ngữ cảnh: sản phẩm có phù hợp vị trí hiển thị hiện tại không.

Ví dụ công thức ý tưởng:

```text
Điểm gợi ý = điểm tương đồng AI + điểm hành vi + điểm phổ biến + điểm ngữ cảnh
```

Sản phẩm có tổng điểm cao hơn sẽ được xếp lên trước trong danh sách gợi ý.

## 8. Các vị trí hiển thị gợi ý trong website

Hệ thống có thể hiển thị gợi ý ở nhiều vị trí:

- Trang chủ: gợi ý sản phẩm nổi bật hoặc cá nhân hóa.
- Trang chi tiết sản phẩm: gợi ý sản phẩm tương tự.
- Giỏ hàng: gợi ý sản phẩm mua kèm.
- Trang đơn hàng: gợi ý sản phẩm phù hợp với lịch sử mua hàng.
- Trang cảm ơn sau thanh toán: gợi ý sản phẩm tiếp theo để khách quay lại mua.

Mỗi vị trí có chiến lược gợi ý khác nhau để phù hợp với ngữ cảnh người dùng.

## 9. Các bảng dữ liệu liên quan

Các dữ liệu recommendation được lưu ở nhiều nơi:

- `recommendation_events`: lưu hành vi người dùng.
- `product_similarities`: lưu quan hệ sản phẩm tương tự nhau.
- `recommendation_caches`: lưu snapshot kết quả gợi ý.
- `product_embeddings`: lưu vector embedding sản phẩm.
- Redis cache: lưu nhanh kết quả gợi ý để tăng tốc độ phản hồi.

Lưu ý: sản phẩm thật vẫn nằm trong bảng `products`. Các bảng recommendation chỉ lưu dữ liệu phục vụ gợi ý.

## 10. Vì sao cần cache kết quả gợi ý?

Việc tính toán recommendation có thể tốn thời gian vì phải xử lý dữ liệu sản phẩm, hành vi và vector AI.

Vì vậy hệ thống dùng Redis cache để:

- Trả kết quả nhanh hơn cho người dùng.
- Giảm tải cho database.
- Giảm số lần gọi AI service.
- Giúp website ổn định hơn khi nhiều người truy cập.

Khi người dùng có hành vi mới như xem sản phẩm, thêm vào giỏ hoặc mua hàng, cache liên quan sẽ được xóa để lần sau hệ thống tính lại gợi ý mới hơn.

## 11. Ưu điểm của cách làm này

- Gợi ý linh hoạt theo từng người dùng.
- Có thể dùng được cả khi người dùng chưa đăng nhập nhờ `sessionId`.
- Kết hợp được cả AI, hành vi người dùng và độ phổ biến.
- Tăng khả năng khách xem thêm sản phẩm.
- Có thể hỗ trợ tăng tỷ lệ chuyển đổi và giá trị đơn hàng.
- Có fallback khi AI service lỗi, website vẫn có thể gợi ý bằng danh mục hoặc sản phẩm phổ biến.

## 12. Hạn chế và hướng cải thiện

Một số hạn chế hiện tại:

- Nếu người dùng mới chưa có hành vi, hệ thống phải dựa nhiều vào sản phẩm phổ biến.
- Nếu dữ liệu sản phẩm nhập chưa đầy đủ, embedding có thể chưa phản ánh đúng sản phẩm.
- Nếu dữ liệu hành vi ít, cá nhân hóa chưa thật sự chính xác.
- Nếu cache chưa được làm mới đúng lúc, gợi ý có thể chưa cập nhật ngay.

Hướng cải thiện:

- Bổ sung thêm dữ liệu về click, thời gian xem, tỷ lệ mua sau khi xem.
- Tối ưu trọng số giữa similarity, popularity và behavior.
- Đánh giá hiệu quả bằng CTR, conversion rate và doanh thu từ recommendation.
- Huấn luyện mô hình tốt hơn khi có nhiều dữ liệu người dùng.

## 13. Kết luận

Chức năng gợi ý sản phẩm trong dự án sử dụng mô hình hybrid recommendation. Hệ thống kết hợp AI embedding, hành vi người dùng, độ tương đồng sản phẩm và độ phổ biến để chọn ra danh sách sản phẩm phù hợp.

AI có thể gợi ý đúng hơn vì nó không nhìn sản phẩm dưới dạng chữ đơn thuần, mà biến thông tin sản phẩm thành vector số để so sánh mức độ giống nhau. Khi kết hợp thêm hành vi người dùng, hệ thống có thể đưa ra gợi ý sát với nhu cầu thực tế hơn.

