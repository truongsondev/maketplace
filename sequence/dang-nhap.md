# Sequence - Đăng nhập

## 1. Phạm vi

- Chức năng: Đăng nhập bằng email và mật khẩu.
- Module backend: `server/src/module/auth`.
- Database liên quan: `users`, `refresh_tokens`.
- Redis: kiểm tra giới hạn đăng nhập và lưu session access token.

## 2. Sequence PlantUML

```plantuml
@startuml
autonumber

actor "Khách hàng" as U
participant "Trình duyệt" as B
participant AuthAPI as API
participant AuthController as CTL
participant LoginUseCase as UC
database DB
database Redis

U -> B: Nhập email, mật khẩu và bấm Đăng nhập
B -> API: Gửi yêu cầu đăng nhập
API -> API: Lấy email, password, IP và thông tin thiết bị
API -> CTL: login(command, ipAddress)
CTL -> UC: execute(command)

UC -> Redis: Kiểm tra rate limit theo IP/email

alt Bị giới hạn đăng nhập
  Redis --> UC: Không cho phép tiếp tục
  UC --> CTL: RateLimitExceededError
  CTL --> API: Lỗi giới hạn đăng nhập
  API --> B: Thông báo thử lại sau
else Chưa bị giới hạn
  Redis --> UC: Cho phép tiếp tục
  UC -> Redis: Tăng bộ đếm rate limit
  Redis --> UC: ok

  UC -> DB: Tìm user theo email
  DB --> UC: user/null

  UC -> UC: So khớp mật khẩu với passwordHash

  alt Không tìm thấy user hoặc mật khẩu sai
    UC --> CTL: InvalidCredentialsError
    CTL --> API: Lỗi thông tin đăng nhập
    API --> B: Thông báo thông tin đăng nhập chưa đúng
  else User và mật khẩu hợp lệ
    alt Email chưa xác thực
      UC --> CTL: InvalidCredentialsError
      CTL --> API: Lỗi thông tin đăng nhập
      API --> B: Thông báo thông tin đăng nhập chưa đúng
    else Email đã xác thực
      alt Trạng thái user không ACTIVE
        UC --> CTL: InvalidCredentialsError
        CTL --> API: Lỗi thông tin đăng nhập
        API --> B: Thông báo thông tin đăng nhập chưa đúng
      else User được phép đăng nhập
        UC -> UC: Tạo accessToken, refreshToken và hash refreshToken
        UC -> Redis: Lưu session access token
        Redis --> UC: ok
        UC -> DB: Thu hồi refresh token cũ cùng thiết bị
        DB --> UC: ok
        UC -> DB: Lưu refresh token mới
        DB --> UC: ok
        UC -> DB: Cập nhật lastLogin
        DB --> UC: ok

        UC --> CTL: token + user
        CTL --> API: token + user
        API --> B: Đăng nhập thành công
        B --> U: Hiển thị trạng thái đã đăng nhập
      end
    end
  end
end

@enduml
```

## 3. Ghi chú

- Hệ thống trả lỗi đăng nhập chung cho các trường hợp: sai email/mật khẩu, email chưa xác thực hoặc tài khoản không ở trạng thái `ACTIVE`.
- Access token không lưu vào DB; session access token được lưu ở Redis trong 3600 giây.
- Refresh token được hash trước khi lưu vào `refresh_tokens`.
- Khi đăng nhập trên cùng thiết bị, refresh token cũ chưa thu hồi của thiết bị đó được thu hồi trước khi tạo token mới.
