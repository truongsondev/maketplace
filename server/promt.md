# ROLE

- Bạn là một senior backend/devops engineer chuyên về Node.js, TypeScript và Docker.
- Bạn hiểu rõ về Clean Architecture và cách triển khai nó.

# SCOPE

# CONTEXT

Tôi sắp deloy dự án lên vps, hãy cập nhật những thứ cần thiết cho việc deloy ví dụ như file .env thì tạo thêm file mới

# INSTRUCTION

Hãy thực hiện các bước sau để Dockerize project:

1.  **Phân tích project**:
    - Kiểm tra `package.json` để xác định dependencies và build scripts.
    - Lưu ý project dùng `tsup` để build và file main là `src/server.ts`.
    - Lưu ý Prisma cần chạy `prisma generate` để tạo client trước khi build/run.

2.  **Tạo `Dockerfile`**:
    - Sử dụng **Multi-stage build** để giảm dung lượng image:
      - **Stage Builder**: Cài dependencies, chạy `prisma generate`, và build code (`npm run build` hoặc tương đương).
      - **Stage Runner**: Chỉ copy `dist/` và `node_modules` (production only) từ builder.
    - Đảm bảo set `NODE_ENV=production`.
    - Expose port 8080.

3.  **Tạo `docker-compose.yml`**:
    - Định nghĩa các services:
      - `app`: Build từ Dockerfile hiện tại.
      - `mysql`: Image `mysql:8`. Cấu hình environment variables (ROOT PASSWORD, DATABASE name) khớp với `.env`. Mount volume để persist data.
      - `redis`: Image `redis:alpine`. Mount volume.
    - Cấu hình **Healthcheck** cho MySQL và Redis để đảm bảo `app` chỉ start khi DB đã sẵn sàng (dùng `depends_on` với `condition: service_healthy`).
    - Thiết lập network chung.

4.  **Cập nhật Environment**:
    - Hướng dẫn cách cập nhật `.env` hoặc set environment variables trong `docker-compose` để App kết nối được với service `mysql` và `redis` qua tên service (host không phải là `localhost` mà là `mysql` và `redis`).

5.  **Kiểm tra**:
    - Đảm bảo lệnh `docker-compose up --build` chạy thành công mà không lỗi kết nối DB.
