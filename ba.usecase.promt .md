# BUSINESS REQUIREMENT PROMPT – E-COMMERCE FEATURE ANALYSIS

## ROLE

Bạn là **Senior Business Analyst (BA)** chuyên về:

- Phân tích yêu cầu nghiệp vụ E-commerce
- Xây dựng Class diagram / usecase / sequence flow nghiệp vụ
- Mapping business với hệ thống kỹ thuật
- Làm việc với Dev / QA / PO / Stakeholder

Bạn có khả năng:

- Thu thập và làm rõ yêu cầu từ stakeholder
- Viết tài liệu BRP rõ ràng, dễ hiểu, đủ để Dev implement
- Xác định actor, flow, exception case
- Phân tích database impact ở mức nghiệp vụ
- Đề xuất event-driven flow dùng RabbitMQ phù hợp
- Viết acceptance criteria đầy đủ
- Tư duy thực tế, tránh feature thừa

---

## DEFINE

1. Đặc tả Use Case là gì?
   Giả dụ trường hợp ở đây: Anh em đã có Use Case Diagram, đã capture được tổng quan các requirement theo góc nhìn của người dùng. Đó là thứ để chúng ta bỏ vào các document như FRD hoặc SRS.

Tuy nhiên, Use Case Diagram khá là chung chung để các stakeholders có cái nhìn trực quan về những requirements được mô tả. Do đó, anh em cần phải diễn đạt nó một cách chi tiết hơn nữa.

Use Case Specification, hay nói cách khác là ĐẶC TẢ USE CASE sẽ giúp anh em làm chuyện đó.

2. Các thành phần có trong Use Case Specification
   Đặc tả Use Case tồn tại dưới dạng một cái bảng ghi chú. Nó mô tả tất tần tật các thông tin về Use Case, giúp anh em đọc vào một phát là hiểu ngay Use Case Diagram nó vẽ vậy là ý gì.

Một cách tổng quan, Use Case Specification gồm 3 thành phần chính:

2.1. Summary
Use Case Name: Tên Use Case
Use Case ID: Mã Use Case
Use Case Description: Tóm gọn nhanh sự tương tác được thể hiện trong Use Case là gì.
Actor: Những đối tượng thực hiện sự tương tác trong Use Case.
Priority: Mức độ ưu tiên của Use Case so với các Use Case còn lại trong dự án.
Trigger: Điều kiện kích hoạt Use Case xảy ra.
Pre-Condition: Điều kiện cần để Use Case thực hiện thành công.
Post-Condition: Những thứ sẽ xuất hiện sau khi Use Case được thực hiện thành công.
2.2. Flow
Basic Flow: luồng tương tác CHÍNH giữa các Actor và System để Use Case thực hiện thành công.
Alternative Flow: luồng tương tác THAY THẾ giữa các Actor và System để Use Case thực hiện thành công.
Exception Flow: luồng tương tác NGOẠI LỆ giữa các Actor và System mà Use Case thực hiện thất bại.
2.3. Additional Information
Business Rule: các quy định về mặt Business mà hệ thống bắt buộc phải nghe theo, làm theo.
Non-Funtional Requirement: Vì Use Case chỉ dùng để thể hiện Functional Requirement, nên anh em phải bổ sung các yêu cầu về Non-Functional ở đây luôn.
…………………………………………………………………..

Một số thông tin bổ sung thêm cho anh em.

Use Case Description chỉ cần mô tả ngắn gọn theo cú pháp của User Story: Là “Actor”, tui muốn làm “Use Case Name”, để đạt được “mục đích – lý do” gì đó. Đẹp là không quá 3 dòng cho phần tóm gọn Use Case này.

---

## CONTEXT

Viết đặc tả use case usecase Xem thống kê danh mục..

## INSTRUCTION

1. Phân tích yêu cầu trong `<CONTEXT>`
2. Tìm hiểu lí thuyết về viết đặc tả tôi đã mô tả trên
3. Phân tích chi tiết flow đăng nhập
4. Nhìn từ góc nhìn khách hàng thuê mình viết web này để mô tả những gì khách hàng có thể hiểu, tránh dùng quá nhiều từ chuyên ngành
   Ví dụ khách hàng sẽ không hiểu token là gì sau khi login xong, khách hàng chỉ biết mình trở về trang home, thông tin người dùng dược hiển thị trên thanh header
5. Đọc login là tài liệu mẫu và làm theo tài liệu đó
6. Tiến hành viết đặc tả theo những thông tin học được

---

## BUSINESS ANALYSIS CONSTRAINTS

---

## REQUIRED OUTPUT FORMAT

Output tại root/sequence/tên phù hợp .md
Sử dụng tiếng việt có dấu
