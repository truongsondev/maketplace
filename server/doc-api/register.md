# Register Flow

## Sequence Diagram

```mermaid
sequenceDiagram
    participant Client
    participant AuthAPI
    participant AuthController
    participant RegisterUseCase
    participant RateLimitHelper
    participant Redis
    participant UserRepository
    participant MySQL
    participant EmailVerificationTokenRepository
    participant EmailSender

    Client->>AuthAPI: POST /api/auth/register { email, password }

    Note over AuthAPI: Validate Input
    AuthAPI->>AuthAPI: validateRegisterInput()
    alt Invalid Input
        AuthAPI-->>Client: 400 Bad Request
    end

    AuthAPI->>AuthAPI: Extract IP Address (req.ip)
    AuthAPI->>AuthController: register({ email, password }, ipAddress)

    AuthController->>AuthController: registerUseCaseFactory.create(ipAddress)
    AuthController->>RegisterUseCase: execute({ email, password })

    Note over RegisterUseCase,Redis: STEP 1 — Rate Limit Check
    RegisterUseCase->>RateLimitHelper: checkRegisterRateLimit(email, ip)

    RateLimitHelper->>Redis: isRegisterRateLimitExceeded(ip)
    alt IP Rate Limit Exceeded
        RateLimitHelper-->>Client: 429 Too Many Requests
    end
    RateLimitHelper->>Redis: incrementRegisterRateLimit(ip)

    RateLimitHelper->>Redis: isRegisterEmailRateLimitExceeded(email)
    alt Email Rate Limit Exceeded
        RateLimitHelper-->>Client: 429 Too Many Requests
    end
    RateLimitHelper->>Redis: incrementRegisterEmailRateLimit(email)

    Note over RegisterUseCase: STEP 2 — Hash Password
    RegisterUseCase->>RegisterUseCase: passwordHasher.hash(password)

    Note over RegisterUseCase: STEP 3 — Validate Email Format
    RegisterUseCase->>RegisterUseCase: new Email(emailString)

    Note over RegisterUseCase: STEP 4 — Create User Entity
    RegisterUseCase->>RegisterUseCase: User.registerWithEmail(email, hashedPassword)
    Note right of RegisterUseCase: emailVerified: false<br/>status: ACTIVE

    Note over RegisterUseCase,MySQL: STEP 5 — Save User
    RegisterUseCase->>UserRepository: save(user)
    UserRepository->>MySQL: INSERT INTO users ...
    alt Duplicate Email
        MySQL-->>RegisterUseCase: Unique Constraint Error
        RegisterUseCase-->>Client: 409 Conflict (EmailAlreadyExistsError)
    end
    MySQL-->>UserRepository: savedUser (with ID)

    Note over RegisterUseCase,EmailVerificationTokenRepository: STEP 6 — Create Verification Token
    RegisterUseCase->>RegisterUseCase: tokenGenerator.generateRandomToken(32)
    RegisterUseCase->>RegisterUseCase: tokenGenerator.hashToken(rawToken)
    RegisterUseCase->>RegisterUseCase: expiresAt = now + 30 minutes
    RegisterUseCase->>EmailVerificationTokenRepository: save(emailVerificationToken)

    Note over RegisterUseCase,EmailSender: STEP 7 — Send Verification Email
    RegisterUseCase->>EmailSender: sendEmailVerification(email, rawToken)

    RegisterUseCase-->>AuthAPI: { message: "Registration successful..." }
    AuthAPI-->>Client: 201 Created { success: true, message: "..." }
```

---

## Step-by-step Flow

```
Client
  │
  │  POST /api/auth/register
  │  Body: { email, password }
  ▼
┌─────────────────────────────────────────────────┐
│                   AuthAPI                        │
│          infrastructure/api/auth.api.ts          │
│                                                  │
│  [1] validateRegisterInput()                     │
│       ├─ email & password có tồn tại?            │
│       ├─ email đúng format?                      │
│       └─ password >= 6 ký tự?                    │
│                                                  │
│  [2] Extract IP: req.ip                          │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│                AuthController                    │
│       interface-adapter/controller               │
│                                                  │
│  registerUseCaseFactory.create(ipAddress)        │
│  → Khởi tạo RegisterUseCase với IP              │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│              RegisterUseCase                     │
│          applications/usecases                   │
│                                                  │
│  ┌─ STEP 1: Rate Limit Check (Redis) ─────────┐ │
│  │  RateLimitHelper                           │ │
│  │   ├─ isRegisterRateLimitExceeded(ip)?      │ │
│  │   │    └─ YES → throw RateLimitExceeded    │ │
│  │   ├─ incrementRegisterRateLimit(ip)        │ │
│  │   ├─ isRegisterEmailRateLimitExceeded(     │ │
│  │   │       email)?                          │ │
│  │   │    └─ YES → throw RateLimitExceeded    │ │
│  │   └─ incrementRegisterEmailRateLimit(email)│ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  STEP 2: Hash Password                           │
│   passwordHasher.hash(password) → hashedPassword │
│                                                  │
│  STEP 3: Validate Email Format                   │
│   new Email(emailString) → Email Value Object    │
│                                                  │
│  STEP 4: Create User Entity                      │
│   User.registerWithEmail(email, hashedPassword)  │
│   → emailVerified: false                         │
│   → status: ACTIVE                               │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│              UserRepository.save()               │
│                   → MySQL                        │
│                                                  │
│  ✅  INSERT OK → savedUser (with generated ID)  │
│  ❌  Duplicate email → catch unique constraint   │
│       → throw EmailAlreadyExistsError            │
└─────────────────────┬───────────────────────────┘
                      │ ✅
                      ▼
┌─────────────────────────────────────────────────┐
│          Email Verification Token                │
│                                                  │
│  - generateRandomToken(32)  → rawToken (256-bit) │
│  - hashToken(rawToken)      → tokenHash          │
│  - expiresAt = now + 30 phút                     │
│  - emailVerificationTokenRepository.save(token)  │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│                 EmailSender                      │
│   sendEmailVerification(email, rawToken)         │
│   → Gửi email kèm rawToken cho user             │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
              HTTP 201 Created
              {
                "success": true,
                "message": "Registration successful.
                            Please verify your email."
              }
```

---

## Error Paths

| Bước | Điều kiện lỗi | Error Class | HTTP Status |
|------|---------------|-------------|-------------|
| Validate input | email/password thiếu | `BadRequestError` | `400 Bad Request` |
| Validate input | email sai format | `BadRequestError` | `400 Bad Request` |
| Validate input | password < 6 ký tự | `BadRequestError` | `400 Bad Request` |
| Rate limit | IP vượt giới hạn request | `RateLimitExceededError` | `429 Too Many Requests` |
| Rate limit | Email vượt giới hạn request | `RateLimitExceededError` | `429 Too Many Requests` |
| Save user | Email đã tồn tại trong DB | `EmailAlreadyExistsError` | `409 Conflict` |
| Các bước khác | Lỗi hệ thống không xác định | `InternalServerError` | `500 Internal Server Error` |

---

## Architecture Layers

```
┌──────────────────────────────────────────────────────┐
│  HTTP Layer        AuthAPI                           │
│                    (POST /api/auth/register)          │
├──────────────────────────────────────────────────────┤
│  Controller        AuthController                    │
│                    RegisterUseCaseFactory             │
├──────────────────────────────────────────────────────┤
│  Application       RegisterUseCase                   │
│                    RateLimitHelper                    │
├──────────────────────────────────────────────────────┤
│  Domain            User Entity                       │
│                    Email Value Object                 │
├──────────────────────────────────────────────────────┤
│  Infrastructure    UserRepository       → MySQL      │
│                    RateLimiter          → Redis       │
│                    EmailVerificationRepo → MySQL      │
│                    EmailSender          → SMTP/SES    │
└──────────────────────────────────────────────────────┘
```
