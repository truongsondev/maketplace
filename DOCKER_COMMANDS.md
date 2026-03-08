# Quick Start Commands for Docker Setup

# ============================================

# DEVELOPMENT

# ============================================

# Start all services (Development)

docker compose -f docker-compose.dev.yml up

# Start in background

docker compose -f docker-compose.dev.yml up -d

# View logs

docker compose -f docker-compose.dev.yml logs -f

# Stop services

docker compose -f docker-compose.dev.yml down

# Stop and remove volumes (reset database)

docker compose -f docker-compose.dev.yml down -v

# ============================================

# STAGING

# ============================================

# Build and start (Staging)

docker compose -f docker-compose.staging.yml up -d --build

# View logs

docker compose -f docker-compose.staging.yml logs -f

# Stop services

docker compose -f docker-compose.staging.yml down

# ============================================

# PRODUCTION

# ============================================

# Build images (Production)

docker compose -f docker-compose.prod.yml build

# Start services

docker compose -f docker-compose.prod.yml up -d

# View logs

docker compose -f docker-compose.prod.yml logs -f

# Update a service (e.g., backend)

docker compose -f docker-compose.prod.yml up -d --no-deps --build backend

# Stop services

docker compose -f docker-compose.prod.yml down

# ============================================

# USEFUL COMMANDS

# ============================================

# Access backend shell

docker compose -f docker-compose.dev.yml exec backend sh

# Run Prisma Studio

docker compose -f docker-compose.dev.yml exec backend npx prisma studio

# Create migration

docker compose -f docker-compose.dev.yml exec backend npx prisma migrate dev --name migration_name

# Deploy migrations

docker compose -f docker-compose.dev.yml exec backend npx prisma migrate deploy

# Access MySQL

docker compose -f docker-compose.dev.yml exec mysql mysql -u root -proot app_db

# View container status

docker compose -f docker-compose.dev.yml ps

# View real-time stats

docker stats

# Clean up unused resources

docker system prune -a

# Clean up including volumes

docker system prune -a --volumes
