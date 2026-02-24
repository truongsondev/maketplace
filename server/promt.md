# ROLE

- Bạn là một senior backend chuyên về nodejs/express
- Bạn hiểu rõ về clean architecture

# SCOPE

@src/module/auth

# CONTEXT
Viết chức năng register theo chuẩn clean architecture

# INSTRUCTION

1. Đọc yêu cầu trong **<CONTEXT>**
2. Thực hiện code chức năng register bằng email theo flow sau
POST /auth/register
{
  email: string,
  password: string,
}
STEP 1 – Validate Input (API Layer)

Kiểm tra:

Email hợp lệ

Password ≥ 6 ký tự

Sai → 400 Bad Request

STEP 2 – Rate Limit (Redis)

Chống spam:

Key:

register:ip:{ip}
register:email:{email}

Tối đa 5 request / phút

Redis INCR + EXPIRE 60

Nếu vượt quá:

429 Too Many Requests

⚠ Redis chỉ chống spam, không đảm bảo uniqueness.

STEP 3 – Kiểm Tra Email Đã Tồn Tại (MySQL)

Không chỉ check trước rồi insert.
Vì có thể xảy ra race condition.

Phải:

Email có unique index trong DB

Xử lý duplicate error khi insert

STEP 4 – Hash Password

Dùng:

Argon2id

Không bao giờ lưu plain text.

STEP 5 – Insert User (MySQL)

Trong transaction đơn giản:

INSERT INTO users (
 
)
VALUES (...)

Nếu lỗi:

Duplicate entry for email

→ Trả:

409 Email already registered

DB là lớp bảo vệ cuối cùng.

STEP 6 – Tạo Email Verification Token

Tạo random 256-bit token.

Hash token trước khi lưu DB.

Lưu vào bảng:

EmailVerificationToken
- userId
- tokenHash
- expiresAt (15–30 phút)
STEP 7 – Gửi Email Xác Thực

(Thực hiện trực tiếp hoặc qua service email)


Email chứa link:

/auth/verify-email?token=rawToken
STEP 8 – Response

Không tự động login nếu chưa verify.

Trả:

201 Created
{
  message: "Registration successful. Please verify your email."
}
4. Endpoint Verify Email
GET /auth/verify-email?token=...

Flow:

Hash token

Tìm trong DB

Nếu không tồn tại → 400

Nếu hết hạn → 400

Update user:

emailVerified = true

Xóa token

5. Các Vấn Đề Quan Trọng
Nếu 2 người đăng ký cùng lúc cùng email?

Unique index trong DB chặn

Một request thành công

Request còn lại nhận 409

Không phụ thuộc logic application.

Nếu Server chết giữa transaction?

MySQL rollback tự động

Không có user nửa vời

Nếu Redis down?

Vẫn đăng ký được

Chỉ mất rate limit


# NOTE
Bạn có thể sửa toàn bộ module auth