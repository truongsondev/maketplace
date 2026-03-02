# Logging System Documentation

## � Vị trí lưu Log Files

### Development (Local)

```
project-root/
└── logs/
    ├── application-2026-03-01.log    # Tất cả logs
    ├── application-2026-03-01.log.gz # Logs cũ đã nén
    ├── error-2026-03-01.log          # Chỉ errors
    └── http-2026-03-01.log           # Chỉ HTTP requests
```

**Lưu ý**: Folder `logs/` chỉ được tạo khi:

- `NODE_ENV=production`, HOẶC
- `ENABLE_FILE_LOGGING=true`

### Production (Docker)

```
Container: /app/logs/
Host Volume: docker volume app_logs

# Xem logs trong container
docker exec -it graduation-project-app ls -lh /app/logs

# Copy logs ra host
docker cp graduation-project-app:/app/logs ./exported-logs/
```

## �📝 Tổng quan

Hệ thống logging đã được triển khai cho toàn bộ project sử dụng **Winston** - một thư viện logging mạnh mẽ và linh hoạt cho Node.js.

## 🏗️ Kiến trúc

### 1. Core Logger (`src/shared/util/logger.ts`)

Logger service tập trung với các tính năng:

- **5 log levels**: error, warn, info, http, debug
- **Contextual logging**: Mỗi module có context riêng
- **Multiple transports**: Console + File (production)
- **Log rotation**: Tự động rotate logs theo ngày
- **Structured logging**: JSON format với metadata

### 2. Log Levels

```typescript
error: 0; // Lỗi nghiêm trọng cần xử lý ngay
warn: 1; // Cảnh báo, không critical
info: 2; // Thông tin quan trọng (login, registration, etc.)
http: 3; // HTTP requests/responses
debug: 4; // Debug information (chỉ development)
```

**Console/Terminal Output**:

- **Development**: Hiển thị TẤT CẢ levels (error → debug)
- **Production**: Hiển thị http và cao hơn (error, warn, info, http)

**File Output** (chỉ khi ENABLE_FILE_LOGGING=true):

- `application-*.log`: Tất cả levels
- `error-*.log`: Chỉ errors
- `http-*.log`: Chỉ HTTP requests

### 3. File Transports (Production)

Logs được lưu tại `./logs/`:

- `application-%DATE%.log` - Tất cả logs (14 ngày)
- `error-%DATE%.log` - Chỉ errors (30 ngày)
- `http-%DATE%.log` - Chỉ HTTP requests (7 ngày)

Cấu hình:

- Max size: 20MB/file
- Auto compress (gzip)
- Auto rotate daily

## 📍 Tích hợp trong các Module

### Auth Module

**RegisterUseCase** logs:

```typescript
✓ User registration attempts
✓ Registration success with userId
✓ Email already exists warnings
✓ Unexpected errors with full context
```

**LoginUseCase** logs:

```typescript
✓ Login attempts with email & device info
✓ Invalid credentials warnings
✓ Email not verified warnings
✓ Account status issues
✓ Successful logins with userId
```

### Product Module

**GetProductsUseCase** logs:

```typescript
✓ Product query parameters
✓ Query results (total, page, filters)
```

**GetCategoryStatsUseCase** logs:

```typescript
✓ Category statistics queries
✓ Filtered results count
```

### HTTP Middleware

**Request Logging** (`src/infrastructure/middlewares/logging.middleware.ts`):

```typescript
✓ Incoming requests (method, URL, IP, user)
✓ Outgoing responses (status code, duration)
```

### Error Handling

**Error Middleware** (`src/shared/server/error-middleware.ts`):

```typescript
✓ All errors với full stack trace
✓ Request context (path, method, query, body, userId)
✓ Async handler errors
```

## 🚀 Sử dụng Logger

### Import và tạo logger instance

```typescript
import { createLogger } from '@/shared/util/logger';

const logger = createLogger('YourModuleName');
```

### Log các level khác nhau

```typescript
// Error với Error object
logger.error('Operation failed', error, { userId, operation: 'register' });

// Warning
logger.warn('Rate limit approaching', { userId, attempts: 4 });

// Info
logger.info('User logged in', { userId, email, deviceInfo });

// HTTP
logger.http('API request', { method: 'GET', url: '/api/users' });

// Debug
logger.debug('Processing data', { itemCount: 10, filters });
```

## ⚙️ Cấu hình

### Environment Variables

```bash
# Development (console only)
NODE_ENV=development

# Production (console + files)
NODE_ENV=production
ENABLE_FILE_LOGGING=true
```

### Docker Configuration

[docker-compose.yml](docker-compose.yml) đã được cấu hình:

```yaml
environment:
  ENABLE_FILE_LOGGING: 'true'
volumes:
  - app_logs:/app/logs # Persist logs
```

### Log Format

**Console/Terminal** (hiển thị cho cả Development & Production):

```
2026-03-01 10:30:45:123 info: [RegisterUseCase] User registered successfully
2026-03-01 10:30:46:456 http: [HTTP] Incoming request
2026-03-01 10:30:46:500 http: [HTTP] Outgoing response
```

**JSON** (Production files):

```json
{
  "timestamp": "2026-03-01 10:30:45:123",
  "level": "info",
  "message": "[RegisterUseCase] User registered successfully",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com"
}
```

## 📊 Monitoring & Analysis

### Xem logs trong Terminal/Console

```bash
# Development - Hiển thị tất cả logs (error, warn, info, http, debug)
npm run dev

# Production - Hiển thị http và cao hơn (error, warn, info, http)
NODE_ENV=production npm start
```

### Xem logs trong Docker

```bash
# Realtime logs (bao gồm HTTP logs)
docker logs graduation-project-app -f

# Logs với filter
docker logs graduation-project-app | grep ERROR
docker logs graduation-project-app | grep http
docker logs graduation-project-app | grep "Incoming request"

# Logs của specific user
docker logs graduation-project-app | grep "userId.*123"
```

### Xem Log Files (Development với ENABLE_FILE_LOGGING=true)

```bash
# Windows PowerShell
$env:ENABLE_FILE_LOGGING="true"
npm run dev

# Linux/Mac
export ENABLE_FILE_LOGGING=true
npm run dev

# Xem log files
Get-Content logs/application-2026-03-01.log -Wait -Tail 50  # PowerShell
tail -f logs/application-2026-03-01.log                     # Linux/Mac

# Xem HTTP logs riêng
Get-Content logs/http-2026-03-01.log -Wait -Tail 50  # PowerShell
tail -f logs/http-2026-03-01.log                     # Linux/Mac
```

### Truy cập log files trong Docker container

```bash
# Access container
docker exec -it graduation-project-app sh

# View logs
cd logs/
ls -lh
tail -f application-2026-03-01.log
tail -f http-2026-03-01.log
```

### Export logs từ Docker volume

```bash
# Copy logs từ Docker volume
docker cp graduation-project-app:/app/logs ./local-logs/
```

## 🎯 Best Practices

### 1. Log Level Guidelines

- **ERROR**: Database connection failed, 3rd party API down
- **WARN**: Rate limit exceeded, deprecated API usage
- **INFO**: User actions (login, register, purchase)
- **HTTP**: All HTTP requests/responses
- **DEBUG**: Variable values, flow control (development only)

### 2. Sensitive Data

**KHÔNG** log:

- Passwords (hashed hoặc plain)
- Credit card numbers
- Personal identification numbers
- Full JWT tokens

**CÓ THỂ** log:

- UserIds
- Email addresses
- Request paths & methods
- Error messages (sanitized)

### 3. Context thích hợp

```typescript
// ✓ Good
logger.info('User registered', { userId, email, timestamp });

// ✗ Bad
logger.info(`User ${email} registered`); // Khó parse
```

### 4. Error logging

```typescript
// ✓ Good - Bao gồm error object
logger.error('Database query failed', error, { query, params });

// ✗ Bad - Chỉ có message
logger.error('Database query failed');
```

## 🔍 Troubleshooting

### Logs không xuất hiện

1. Check NODE_ENV:

```bash
echo $NODE_ENV
```

2. Check file logging enabled:

```bash
echo $ENABLE_FILE_LOGGING
```

3. Check logs directory permissions:

```bash
ls -la logs/
```

### Performance issues

Nếu logging làm chậm app:

1. Giảm log level trong production (warn thay vì debug)
2. Tăng batch size cho transports
3. Sử dụng async logging

### Log files quá lớn

Điều chỉnh trong [logger.ts](src/shared/util/logger.ts):

```typescript
maxSize: '20m',    // -> '10m'
maxFiles: '14d',   // -> '7d'
```

## 📈 Future Enhancements

- [ ] Tích hợp ELK Stack (Elasticsearch, Logstash, Kibana)
- [ ] Centralized logging service
- [ ] Real-time log analysis dashboard
- [ ] Alert system cho critical errors
- [ ] Performance metrics logging
- [ ] Distributed tracing với correlation IDs

## 🎓 Resources

- [Winston Documentation](https://github.com/winstonjs/winston)
- [Winston Daily Rotate File](https://github.com/winstonjs/winston-daily-rotate-file)
- [Logging Best Practices](https://www.loggly.com/ultimate-guide/node-logging-basics/)
