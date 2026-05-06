# FULL IMPLEMENTATION PROMPT — AI RECOMMENDATION SYSTEM (ALL PHASES)

## ROLE

Bạn là:

- Senior Fullstack Engineer
- Senior AI Engineer
- Senior Machine Learning Engineer
- Senior Data Engineer
- Senior MLOps Engineer
- Senior System Architect

Bạn có kinh nghiệm triển khai:

- E-commerce systems
- Recommendation systems
- Real-time personalization
- AI ranking systems
- Distributed systems
- Production AI platforms

Hãy triển khai hoàn chỉnh hệ thống:
"AI Product Recommendation System"
cho website bán đồ thời trang

---

# PROJECT CONTEXT

Tôi muốn xây dựng hệ thống:
Gợi ý sản phẩm bằng AI dựa trên hành vi người dùng.

Hệ thống cần:

- scalable
- production-ready
- clean architecture
- dễ mở rộng
- phù hợp portfolio/mini

---

# TECH STACK

## Frontend

- Next.js
- TypeScript
- TailwindCSS

## Backend

- Node.js
- Express
- TypeScript

## Database

- MySQL
- Prisma ORM

## Cache

- Redis

## Queue

- RabbitMQ

## AI Service

- Python
- FastAPI

## AI/ML Libraries

- pandas
- numpy
- scikit-learn
- LightFM
- Sentence Transformers

## Vector Search

- pgvector

## Logging & Monitoring

- Pino
- Prometheus
- Grafana

## Deployment

- Docker
- Docker Compose

---

# IMPLEMENTATION SCOPE

Hãy triển khai toàn bộ các giai đoạn sau:

---

# GIAI ĐOẠN 0 — DATA FOUNDATION

Triển khai:

- tracking spec
- event schema
- product schema
- KPI definition
- recommendation positions
- product metadata structure

Bao gồm:

- event design
- tracking design
- product mapping
- data normalization

---

# GIAI ĐOẠN 1 — TRACKING & DATA PIPELINE

Triển khai:

- frontend tracking
- backend tracking
- tracking middleware
- event ingestion
- RabbitMQ pipeline
- Redis integration
- logging system
- monitoring system

Tracking events:

- ViewProduct
- AddToCart
- RemoveFromCart
- Purchase
- SearchQuery
- FavoriteProduct

Bao gồm:

- retry strategy
- deduplication
- dead-letter queue
- event validation
- observability

---

# GIAI ĐOẠN 2 — BASELINE RECOMMENDATION

Triển khai:

- trending recommendation
- top viewed
- top purchased
- item-item recommendation
- similarity recommendation
- recommendation cache

Algorithms:

- cosine similarity
- co-occurrence
- trending ranking

Bao gồm:

- recommendation API
- Redis cache
- batch processing
- cron jobs

---

# GIAI ĐOẠN 3 — HYBRID AI RECOMMENDATION

Triển khai:

- collaborative filtering
- content-based recommendation
- hybrid recommendation
- embedding system
- ranking engine
- vector similarity search

AI models:

- LightFM
- Sentence Transformers
- Matrix Factorization

Bao gồm:

- product embeddings
- user embeddings
- ranking formula
- recommendation scoring
- pgvector integration

---

# GIAI ĐOẠN 4 — REALTIME PERSONALIZATION

Triển khai:

- session-based recommendation
- realtime recommendation updates
- recent behavior recommendation
- realtime cache update

Bao gồm:

- low latency architecture
- realtime event processing
- recommendation refresh
- online inference flow

---

# GIAI ĐOẠN 5 — MLOPS & PRODUCTION AI

Triển khai:

- A/B testing system
- experiment system
- model monitoring
- drift detection
- retraining pipeline
- recommendation analytics
- Prometheus monitoring
- Grafana dashboard

Bao gồm:

- rollout strategy
- rollback strategy
- feature flags
- recommendation quality metrics

---

# SYSTEM REQUIREMENTS

## 1. CLEAN ARCHITECTURE

Áp dụng:

- clean architecture (Đọc module auth để tham khảo form clean architecture hiện tại)

---

## 2. DATABASE DESIGN

Generate:

- Prisma schema
- indexes
- vector fields
- recommendation tables
- analytics tables

---

## 3. BACKEND IMPLEMENTATION

Generate:

- folder structure
- services
- controllers
- middlewares
- queues
- workers
- cron jobs

---

## 4. PYTHON AI SERVICE

Generate:

- FastAPI application
- recommendation engine
- embedding pipeline
- training pipeline
- ranking pipeline

---

## 5. VECTOR SEARCH

Triển khai:

- pgvector
- vector indexing
- similarity search

---

## 6. REDIS INTEGRATION

Sử dụng Redis cho:

- recommendation cache
- session cache
- ranking cache
- hot products

---

## 7. RABBITMQ INTEGRATION

Triển khai:

- producer
- consumer
- retry queues
- dead-letter queues

---

## 8. LOGGING SYSTEM

Triển khai:

- Pino logger
- correlation ID
- request tracing
- structured logging

---

## 9. MONITORING SYSTEM

Generate:

- Prometheus metrics
- Grafana dashboard
- recommendation metrics
- queue metrics
- latency metrics

---

## 10. DOCKER SETUP

---

# API REQUIREMENTS

Generate APIs:

## Tracking APIs

- POST /track

## Recommendation APIs

- GET /recommendations/home
- GET /recommendations/product/:id
- GET /recommendations/cart
- GET /recommendations/personalized

## Analytics APIs

- GET /analytics/recommendations

---

# FRONTEND REQUIREMENTS

Triển khai:

- recommendation blocks (Tại trang home, trang giở hàng, trang chi tiết giỏ hàng, Đơn mua)
- loading states
- skeleton UI
- error fallback
- recommendation tracking

---

# AI REQUIREMENTS

Triển khai:

- recommendation ranking
- similarity scoring
- recommendation filtering
- diversity logic
- cold-start handling

---

# OUTPUT REQUIREMENTS

Hãy generate đầy đủ:

## 1. Architecture

- system clean architecture
- data flow diagrams

## 2. Backend Source Code

- Node.js implementation
- Express APIs
- queue workers
- middleware

## 3. AI Source Code

- Python recommendation engine
- training scripts
- embedding generation
- ranking engine

## 4. Database

- Prisma schema
- migrations
- indexes

## 5. Infrastructure

## 6. Monitoring

- Prometheus config
- Grafana dashboard

## 7. API Contracts

- request/response examples

## 8. Recommendation Logic

- scoring formula
- ranking strategy
- fallback strategy

## 9. Production Readiness

- retry strategy
- scalability
- failover
- resilience

---

# IMPORTANT REQUIREMENTS

- Viết production-ready code
- Viết clean architecture
- Giải thích ngắn cho từng phần
- Không pseudo-code
- Viết code thật
- Có folder structure đầy đủ
- Có Docker setup hoàn chỉnh
- Có AI implementation thực tế
- Có recommendation ranking thực tế
- Có caching strategy thực tế
- Có monitoring strategy thực tế

---

# OUTPUT FORMAT

Xuất toàn bộ dưới dạng:

- Markdown
- Có heading rõ ràng
- Có code blocks
- Có folder tree
- Có architecture diagrams dạng text
- Có comments giải thích

Bắt đầu từ:

1. System Architecture
2. Folder Structure
3. Database Design
4. Backend Implementation
5. AI Service
6. Recommendation Engine
7. Realtime System
8. Monitoring
9. Deployment
10. Production Checklist

# NOTE

- Ghi nhớ context vào NOTES.md để nếu quên thì dựa vào đó để đưa ra những quyết định chính xác nhất
