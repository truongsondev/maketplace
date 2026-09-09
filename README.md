# Aura Fashion Marketplace

Aura Fashion Marketplace là hệ thống thương mại điện tử thời trang có tích hợp AI recommendation, chatbot, thanh toán PayOS, quản trị sản phẩm/đơn hàng và dashboard vận hành. Dự án được tổ chức theo mô hình monorepo gồm backend API, frontend khách hàng, frontend quản trị, AI service và hạ tầng local bằng Docker Compose.

## Thành phần chính

| Thành phần | Thư mục | Công nghệ | Mô tả |
| --- | --- | --- | --- |
| Backend API | `server` | Node.js, Express, TypeScript, Prisma, MySQL, Redis, RabbitMQ | Xử lý nghiệp vụ marketplace, auth, cart, order, payment, admin, recommendation, chatbot |
| Client khách hàng | `client-next` | Next.js, React, TypeScript, Tailwind CSS | Website mua sắm cho người dùng |
| Client quản trị | `client-seller` | Vite, React, TypeScript, Tailwind CSS | Trang quản trị sản phẩm, đơn hàng, banner, voucher, người dùng, báo cáo |
| AI service | `ai-service` | FastAPI, NumPy, pgvector | Sinh embedding sản phẩm và gợi ý sản phẩm theo ngữ cảnh |
| Hạ tầng | `infra`, `nginx`, `docker-compose.*.yml` | Docker, Prometheus, Grafana, Nginx | Chạy local/dev/prod, quan sát metrics và reverse proxy |

## Tính năng nổi bật

- Đăng ký, đăng nhập, xác thực JWT, Google OAuth, quên/đặt lại mật khẩu.
- Quản lý sản phẩm, biến thể, tồn kho, ảnh Cloudinary, danh mục và tag.
- Giỏ hàng, đặt hàng, theo dõi đơn, hủy đơn, hoàn trả/hoàn tiền.
- Thanh toán PayOS, webhook và worker đối soát giao dịch.
- Voucher, banner, đánh giá sản phẩm, sản phẩm yêu thích.
- Admin dashboard, thống kê sản phẩm/đơn hàng/người dùng, logs và thông báo realtime.
- Recommendation hybrid dựa trên hành vi người dùng, embedding sản phẩm và độ phổ biến.
- Chatbot tư vấn dựa trên dữ liệu cửa hàng và Gemini.
- Prometheus/Grafana cho metrics backend và AI service.

## Cấu trúc thư mục

```text
.
├── ai-service/          # FastAPI service cho recommendation/embedding
├── client-next/         # Website khách hàng bằng Next.js
├── client-seller/       # Trang quản trị bằng Vite React
├── docs/                # Tài liệu BRD, thiết kế tính năng
├── infra/               # Prometheus, Grafana dashboard/provisioning
├── nginx/               # Cấu hình reverse proxy
├── server/              # Backend API Express + Prisma
├── diagram/             # Sơ đồ nghiệp vụ/kỹ thuật
├── sequence/            # Sequence diagram dạng markdown
├── docker-compose.dev.yml
└── docker-compose.prod.yml
```

## Yêu cầu môi trường

- Docker và Docker Compose.
- Node.js 20+ nếu chạy thủ công.
- Python 3.10+ nếu chạy `ai-service` thủ công.
- MySQL 8, Redis, RabbitMQ và PostgreSQL/pgvector nếu không dùng Docker Compose.

## Cài đặt biến môi trường

Tạo file môi trường từ mẫu:

```bash
cp .env.example .env
cp server/.env.example server/.env.development
```

Trên Windows PowerShell:

```powershell
Copy-Item .env.example .env
Copy-Item server/.env.example server/.env.development
```

Khi chạy bằng `docker-compose.dev.yml`, các giá trị mặc định cho MySQL, Redis, RabbitMQ, pgvector, Prometheus và Grafana đã được cấu hình trong compose. Một số tích hợp bên ngoài vẫn cần điền trong `server/.env.development` nếu sử dụng:

- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `CLIENT_ID`, `API_KEY`, `CHECKSUM_KEY` cho PayOS
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- `GEMINI_API_KEY`
- `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`

## Chạy nhanh bằng Docker

```bash
docker compose -f docker-compose.dev.yml up --build
```

Các dịch vụ local:

| Dịch vụ | URL |
| --- | --- |
| Website khách hàng | http://localhost:3000 |
| Trang quản trị | http://localhost:5173 |
| Backend API | http://localhost:8080 |
| Backend health check | http://localhost:8080/health |
| Backend metrics | http://localhost:8080/metrics |
| AI service | http://localhost:8000 |
| AI health check | http://localhost:8000/health |
| RabbitMQ Management | http://localhost:15672 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 |

Tài khoản RabbitMQ mặc định: `guest` / `guest`.

Tài khoản Grafana mặc định: `admin` / `admin`.

Dừng toàn bộ dịch vụ:

```bash
docker compose -f docker-compose.dev.yml down
```

Xóa cả volume dữ liệu local:

```bash
docker compose -f docker-compose.dev.yml down -v
```

## Chạy thủ công từng service

### Backend

```bash
cd server
npm install
npm run prisma:generate
npx prisma migrate deploy
npm run dev
```

Backend mặc định đọc file môi trường theo `NODE_ENV`, ví dụ `server/.env.development`.

### Worker đối soát PayOS

```bash
cd server
npm run payos:worker:dev
```

### Client khách hàng

```bash
cd client-next
npm install
npm run dev
```

Nếu chạy ngoài Docker, cấu hình API base URL:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

### Client quản trị

```bash
cd client-seller
npm install
npm run dev
```

Nếu chạy ngoài Docker, cấu hình API base URL:

```env
VITE_API_BASE_URL=http://localhost:8080
```

### AI service

```bash
cd ai-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Biến môi trường quan trọng:

```env
VECTOR_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/recommendation
EMBEDDING_DIMENSIONS=384
```

## Scripts thường dùng

Backend:

```bash
npm run dev
npm run test
npm run test:watch
npm run test:coverage
npm run prisma:generate
npm run payos:worker:dev
```

Client khách hàng:

```bash
npm run dev
npm run build
npm run start
npm run lint
```

Client quản trị:

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## API và tài liệu

- Tài liệu API backend: `server/api.md`, `server/doc-api/`
- Tài liệu nghiệp vụ/tính năng: `docs/`
- Tài liệu recommendation: `docs/ai-recommendation-system.md`
- Sơ đồ và sequence: `diagram/`, `sequence/`, `ba/`
- Schema Prisma: `server/prisma/schema.prisma`
- Mô tả bảng dữ liệu: `mo-ta-cac-bang-schema.md`

## Kiểm thử

Chạy test backend:

```bash
cd server
npm run test
```

Chạy lint frontend:

```bash
cd client-next
npm run lint

cd ../client-seller
npm run lint
```

## Ghi chú phát triển

- Backend dùng kiến trúc module theo từng domain trong `server/src/module`.
- Các endpoint public nằm trước middleware auth, còn các endpoint người dùng/admin được bảo vệ bằng session Redis và role middleware.
- Prisma migration nằm trong `server/prisma/migrations`.
- Docker dev mount source code vào container để hỗ trợ hot reload.
- Recommendation service dùng pgvector làm vector store và có fallback hashing embedding nếu không tải được sentence-transformer.
