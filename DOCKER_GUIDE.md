# Docker Setup Guide

Complete Docker setup for fullstack project với 3 môi trường: development, staging, và production.

## 📋 Yêu cầu hệ thống

- Docker Desktop (Windows/Mac) hoặc Docker Engine (Linux)
- Docker Compose v3.8+
- Node.js 20+ (cho development không dùng Docker)
- 4GB RAM tối thiểu

## 🏗️ Cấu trúc dự án

```
project/
├── server/                    # Backend (Node.js + Express)
│   ├── Dockerfile            # Production build
│   ├── Dockerfile.dev        # Development với hot reload
│   ├── .dockerignore
│   ├── .env.development
│   ├── .env.staging
│   └── .env.prod
├── client-seller/            # Admin Frontend (React + Vite)
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── .dockerignore
├── client-next/              # User Frontend (Next.js)
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── .dockerignore
├── nginx/                    # Nginx configs
│   ├── nginx.dev.conf
│   ├── nginx.staging.conf
│   ├── nginx.prod.conf
│   └── ssl/                  # SSL certificates
├── docker-compose.dev.yml
├── docker-compose.staging.yml
└── docker-compose.prod.yml
```

## 🚀 Cách sử dụng

### 1️⃣ Development (Môi trường phát triển)

**Khởi động tất cả services:**

```bash
docker compose -f docker-compose.dev.yml up
```

**Chạy ở chế độ background:**

```bash
docker compose -f docker-compose.dev.yml up -d
```

**Rebuild và khởi động:**

```bash
docker compose -f docker-compose.dev.yml up --build
```

**Lần đầu sau khi đổi cấu hình Docker/dev watcher (quan trọng):**

```bash
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up -d --build
```

Sau bước này, khi sửa code backend/frontend, container dev sẽ tự detect thay đổi và app tự reload/restart, không cần down/up lại mỗi lần sửa.

**Xem logs:**

```bash
# Tất cả services
docker compose -f docker-compose.dev.yml logs -f

# Chỉ backend
docker compose -f docker-compose.dev.yml logs -f backend
```

**Dừng services:**

```bash
docker compose -f docker-compose.dev.yml down
```

**Dừng và xóa volumes (reset database):**

```bash
docker compose -f docker-compose.dev.yml down -v
```

**Truy cập:**

- Backend API: http://localhost:8080
- Admin Frontend: http://localhost:5173
- User Frontend: http://localhost:3000
- MySQL: localhost:3306
- Redis: localhost:6379

**Đặc điểm Development:**

- Hot reload được bật cho tất cả services
- Source code được mount vào container (thay đổi code = tự động reload)
- Node modules được cache trong volumes
- Database data được lưu trong volumes
- Logs hiển thị realtime

### 2️⃣ Staging (Môi trường test)

**Build và khởi động:**

```bash
docker compose -f docker-compose.staging.yml up -d --build
```

**Xem logs:**

```bash
docker compose -f docker-compose.staging.yml logs -f
```

**Restart một service:**

```bash
docker compose -f docker-compose.staging.yml restart backend
```

**Dừng services:**

```bash
docker compose -f docker-compose.staging.yml down
```

**Truy cập:**

- Backend API: http://localhost:8081
- Admin Frontend: http://localhost:5174
- User Frontend: http://localhost:3001
- MySQL: localhost:3307
- Redis: localhost:6380

**Đặc điểm Staging:**

- Build production images
- Mô phỏng môi trường production
- Có thể test trước khi deploy production
- Sử dụng biến môi trường từ `.env.staging`

### 3️⃣ Production (Môi trường thực tế)

**⚠️ Quan trọng: Cấu hình trước khi chạy**

1. Copy và sửa file environment:

```bash
cp .env.example .env
```

2. Cập nhật passwords trong `.env`:

```env
DB_PASSWORD=your_strong_password
REDIS_PASSWORD=your_redis_password
```

3. Cập nhật domain trong `nginx/nginx.prod.conf`:

```nginx
server_name your-domain.com www.your-domain.com;
```

**Build images:**

```bash
docker compose -f docker-compose.prod.yml build
```

**Khởi động services:**

```bash
docker compose -f docker-compose.prod.yml up -d
```

**Xem logs:**

```bash
docker compose -f docker-compose.prod.yml logs -f
```

**Update một service (ví dụ: backend):**

```bash
docker compose -f docker-compose.prod.yml up -d --no-deps --build backend
```

**Dừng services:**

```bash
docker compose -f docker-compose.prod.yml down
```

**Truy cập:**

- All services: http://your-domain.com hoặc http://localhost
- Nginx routes:
  - `/api/*` → Backend API
  - `/admin/*` → Admin Frontend
  - `/` → User Frontend (Next.js)

**Đặc điểm Production:**

- Multi-stage builds (images nhỏ gọn)
- Nginx reverse proxy
- Health checks
- Restart policies
- Production optimizations
- Secure database config
- Persistent volumes

## 🔧 Các lệnh hữu ích

### Container Management

```bash
# Xem các container đang chạy
docker compose -f docker-compose.dev.yml ps

# Vào shell của container
docker compose -f docker-compose.dev.yml exec backend sh
docker compose -f docker-compose.dev.yml exec mysql mysql -u root -proot

# Chạy lệnh trong container
docker compose -f docker-compose.dev.yml exec backend npm run prisma:studio
docker compose -f docker-compose.dev.yml exec backend npx prisma migrate dev
```

### Database Management

```bash
# Chạy Prisma Studio
docker compose -f docker-compose.dev.yml exec backend npx prisma studio

# Tạo migration mới
docker compose -f docker-compose.dev.yml exec backend npx prisma migrate dev --name your_migration_name

# Deploy migrations
docker compose -f docker-compose.dev.yml exec backend npx prisma migrate deploy

# Reset database
docker compose -f docker-compose.dev.yml exec backend npx prisma migrate reset

# Backup MySQL database
docker compose -f docker-compose.prod.yml exec mysql mysqldump -u root -p${DB_PASSWORD} app_db > backup.sql

# Restore MySQL database
docker compose -f docker-compose.prod.yml exec -T mysql mysql -u root -p${DB_PASSWORD} app_db < backup.sql
```

### Volume Management

```bash
# List volumes
docker volume ls

# Backup volume
docker run --rm -v prod_mysql_prod_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql-backup.tar.gz /data

# Xóa volumes không dùng
docker volume prune
```

### Image Management

```bash
# List images
docker images

# Remove image
docker rmi image_name

# Xóa tất cả unused images
docker image prune -a
```

### System Cleanup

```bash
# Xóa tất cả unused containers, networks, images
docker system prune -a

# Xóa bao gồm cả volumes
docker system prune -a --volumes

# Xem disk usage
docker system df
```

## 🔍 Troubleshooting

### Port đã được sử dụng

```bash
# Tìm process đang dùng port
# Windows
netstat -ano | findstr :8080

# Linux/Mac
lsof -i :8080

# Thay đổi port trong docker-compose file nếu cần
```

### Container không start

```bash
# Xem logs chi tiết
docker compose -f docker-compose.dev.yml logs backend

# Xem logs realtime
docker compose -f docker-compose.dev.yml logs -f backend
```

### Database connection failed

```bash
# Kiểm tra MySQL đã chạy chưa
docker compose -f docker-compose.dev.yml ps mysql

# Xem logs MySQL
docker compose -f docker-compose.dev.yml logs mysql

# Test connection
docker compose -f docker-compose.dev.yml exec mysql mysql -u root -proot -e "SELECT 1"
```

### Hot reload không hoạt động

Đảm bảo volumes được mount đúng trong docker-compose file:

```yaml
volumes:
  - ./server:/app
  - /app/node_modules
```

### Permission issues (Linux)

```bash
# Fix permissions
sudo chown -R $USER:$USER .
```

## 🔐 Security Best Practices

### Development

- ✅ Sử dụng default passwords (root/root)
- ✅ Expose ports cho dễ debug

### Production

- ⚠️ **KHÔNG BAO GIỜ** commit file `.env` vào Git
- ⚠️ Sử dụng strong passwords cho database và Redis
- ⚠️ Cập nhật JWT keys
- ⚠️ Enable SSL/HTTPS với certificates thật
- ⚠️ Đổi default passwords
- ⚠️ Restrict database ports (không expose ra ngoài)
- ⚠️ Sử dụng Docker secrets hoặc vault cho sensitive data
- ⚠️ Thường xuyên update base images
- ⚠️ Scan images để tìm vulnerabilities:
  ```bash
  docker scan prod-backend
  ```

## 📦 SSL/HTTPS Setup (Production)

1. Tạo SSL certificates folder:

```bash
mkdir -p nginx/ssl
```

2. Đặt certificates vào `nginx/ssl/`:

- `certificate.crt`
- `private.key`
- `ca_bundle.crt` (optional)

3. Uncomment SSL config trong `nginx/nginx.prod.conf`

4. Restart nginx:

```bash
docker compose -f docker-compose.prod.yml restart nginx
```

### Generate self-signed certificate (Testing only):

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/private.key \
  -out nginx/ssl/certificate.crt
```

## 🎯 Environment Variables

### Backend (.env files)

Tạo file `.env` tương ứng cho mỗi môi trường:

**server/.env.development**

```env
NODE_ENV=development
DATABASE_URL=mysql://root:root@mysql:3306/app_db
REDIS_HOST=redis
REDIS_PASSWORD=root
```

**server/.env.staging**

```env
NODE_ENV=staging
DATABASE_URL=mysql://root:staging_password@mysql:3306/app_db
REDIS_HOST=redis
REDIS_PASSWORD=staging_redis_pass
```

**server/.env.prod**

```env
NODE_ENV=production
DATABASE_URL=mysql://root:${DB_PASSWORD}@mysql:3306/app_db
REDIS_HOST=redis
REDIS_PASSWORD=${REDIS_PASSWORD}
```

## 🚦 Health Checks

Tất cả services đều có health checks:

```bash
# Kiểm tra health status
docker compose -f docker-compose.prod.yml ps

# Output sẽ hiển thị health status: healthy/unhealthy
```

## 📊 Monitoring

### View logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100 backend
```

### Container stats

```bash
# Real-time stats
docker stats

# Specific containers
docker stats prod-backend prod-mysql prod-redis
```

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Build and deploy
        run: |
          docker compose -f docker-compose.prod.yml build
          docker compose -f docker-compose.prod.yml up -d
```

## 📝 Notes

- Development environment sử dụng hot reload, thay đổi code sẽ tự động reload
- Staging environment giống production nhưng dùng cho testing
- Production environment tối ưu cho performance và security
- MySQL data được lưu trong Docker volumes
- Redis data persistence enabled
- Nginx làm reverse proxy và load balancer

## 🆘 Support

Nếu gặp vấn đề:

1. Check logs: `docker compose logs -f`
2. Check container status: `docker compose ps`
3. Restart services: `docker compose restart`
4. Rebuild: `docker compose up --build`
5. Clean restart: `docker compose down -v && docker compose up --build`

---

**Happy Dockering! 🐳**
