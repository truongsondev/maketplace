# Quy Trình Đăng Ký Tài Khoản Email (OTP Flow)

Quy trình này được thiết kế nhằm **đảm bảo an toàn**, **xác thực email ngay từ đầu** và **tránh tạo tài khoản rác (zombie users)** trong hệ thống.

---

## 🔄 Tổng Quan Quy Trình

Quy trình đăng ký gồm **2 bước chính**:

- **Bước 1 – Gửi OTP**  
  Người dùng nhập email → Hệ thống gửi mã OTP đến email.

- **Bước 2 – Xác thực OTP & Tạo tài khoản**  
  Người dùng nhập OTP + mật khẩu → Hệ thống xác thực, tạo tài khoản và trả về token đăng nhập.

---

## 🛠 Chi Tiết Kỹ Thuật

---

## Bước 1: Yêu Cầu Gửi Mã OTP

### API Endpoint

POST /api/auth/register/send-otp

### Input

```json
{
  "email": "user@example.com"
}
Xử Lý Tại Backend
Use Case: SendEmailOtpUseCase

Validate Email

Kiểm tra định dạng email hợp lệ.

Check Existence

Kiểm tra email đã tồn tại trong bảng User hay chưa.

Nếu đã tồn tại → trả về lỗi EmailAlreadyExistsError (HTTP 409).

Generate OTP

Sinh mã OTP gồm 6 chữ số (ví dụ: 123456).

Thiết lập thời gian hết hạn (mặc định: 10 phút).

Save OTP

Lưu OTP vào bảng Otp (hoặc Redis).

Cấu trúc dữ liệu:

{
  "email": "user@example.com",
  "otp": "123456",
  "expiresAt": "2026-01-01T10:00:00Z",
  "attempts": 0
}
Lưu ý: Chưa lưu mật khẩu ở bước này.

Send Email

Gửi email chứa mã OTP đến người dùng.

Response
{
  "status": true,
  "message": "OTP has been sent to your email"
}
Bước 2: Xác Thực OTP & Thiết Lập Mật Khẩu
API Endpoint
POST /api/auth/register/verify-otp
Input
{
  "email": "user@example.com",
  "otp": "123456",
  "password": "StrongPassword123"
}
Xử Lý Tại Backend
Use Case: VerifyEmailOtpUseCase

Validate Input

Kiểm tra định dạng email.

Kiểm tra độ mạnh mật khẩu (tối thiểu 8 ký tự).

Get OTP

Tìm bản ghi OTP theo email.

Không tìm thấy → OtpNotFoundError.

Check Limits

Nếu số lần nhập sai OTP vượt quá giới hạn (ví dụ: 5 lần):

Xóa OTP.

Trả về TooManyOtpAttemptsError.

Nếu OTP đã hết hạn:

Xóa OTP.

Trả về InvalidOtpError.

Verify OTP

So sánh OTP người dùng nhập với OTP trong DB.

Nếu sai:

Tăng biến attempts.

Trả về InvalidOtpError.

Race Condition Check

Kiểm tra lại email đã tồn tại trong bảng User hay chưa
(phòng trường hợp đăng ký song song).

Create User

Hash mật khẩu (bcrypt / argon2).

Tạo entity User với trạng thái:

emailVerified = true

status = ACTIVE

role = BUYER

Persist

Lưu user vào database.

Xóa bản ghi OTP (cleanup).

Issue Tokens

Sinh AccessToken (JWT).

Sinh RefreshToken và lưu vào bảng UserToken.

Response
{
  "accessToken": "jwt_access_token",
  "refreshToken": "refresh_token",
  "expiresIn": 3600,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "emailVerified": true,
    "status": "ACTIVE"
  }
}
```
