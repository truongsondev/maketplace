# AI Product Recommendation System

## 1. System Architecture

```text
Next.js Client
  |- POST /api/track
  |- GET /api/recommendations/*
  v
Express API
  |- Auth middleware
  |- Recommendation module
  |- Metrics /metrics
  v
RabbitMQ -> recommendation_tracking_q -> retry_q -> dlq
  v
Recommendation ingest consumer
  |- Prisma/MySQL event storage
  |- Redis hot/recent signals
  |- Similarity refresh scheduler
  v
Recommendation read path
  |- Redis cache
  |- MySQL recommendation tables
  |- AI Service + pgvector similarity search
  v
FastAPI AI Service
  |- /train
  |- /recommend/hybrid
  |- /embed/products
  v
Prometheus -> Grafana
```

## 2. Folder Structure

```text
server/src/module/recommendation
  applications/
  entities/
  infrastructure/
  interface-adapter/
  di.ts

client-next/components/page/recommendation-shelf.tsx
client-next/hooks/use-recommendations.ts
client-next/services/recommendation.service.ts
client-next/services/tracking.service.ts

ai-service/
  app/main.py
  requirements.txt
  Dockerfile

infra/
  prometheus/prometheus.yml
  grafana/provisioning/*
  grafana/dashboards/recommendation-overview.json
```

## 3. Database Design

Core tables added:

- `recommendation_events`: immutable behavioral event log with dedupe key.
- `product_similarities`: batch-refreshed co-occurrence/item similarity edges.
- `recommendation_caches`: persisted cache snapshots for home/product/cart/personalized feeds.
- `product_embeddings`, `user_embeddings`: embedding persistence.
- `recommendation_experiments`: A/B rollout metadata.
- `recommendation_metric_snapshots`: offline KPI snapshots.

## 4. Backend Implementation

- Tracking API: `POST /api/track`
- Recommendation APIs:
  - `GET /api/recommendations/home`
  - `GET /api/recommendations/product/:id`
  - `GET /api/recommendations/cart`
  - `GET /api/recommendations/personalized`
- Analytics API: `GET /api/analytics/recommendations`
- Queue flow: publish -> retry queue -> dead-letter queue.
- Cache layers:
  - Redis for low-latency response and recent-user signals.
  - MySQL `recommendation_caches` for recovery/audit.
  - FastAPI service is called during refresh and online recommendation for vector similarity retrieval.

## 5. AI Service

- FastAPI baseline hybrid engine.
- `pgvector` is initialized in PostgreSQL and used for online vector similarity search.
- Embedding strategy:
  - Prefer `sentence-transformers/all-MiniLM-L6-v2`
  - Fallback to hashing embedding when model cannot be loaded
- Endpoints:
  - `GET /health`
  - `GET /metrics`
  - `POST /train`
  - `POST /recommend/hybrid`
  - `POST /embed/products`

## 6. Recommendation Logic

Scoring formula used in current implementation:

```text
final_score = (content_score * 0.7) + (log1p(popularity) * 0.25) + diversity_bonus
```

Fallback strategy:

- Home: top viewed + top purchased merge
- Product detail: pgvector similarity -> product similarity table -> same category fallback
- Cart: pgvector on cart context -> similarity union -> exclude cart items
- Personalized: pgvector on recent user context -> related products -> home fallback

## 7. Realtime System

- `recommendation_events` consume path updates Redis:
  - `recommendations:hot-products`
  - `recommendations:recent:{userId}`
- Scheduler refreshes:
  - co-occurrence similarities
  - global home cache
  - AI training payload sync
  - embedding upsert into pgvector

## 8. Monitoring

- Express metrics served via `/metrics`
- Grafana dashboard file: `infra/grafana/dashboards/recommendation-overview.json`
- Current key metrics:
  - `recommendation_events_total`
  - `recommendation_cache_hits_total`
  - `recommendation_generation_latency_ms`
  - `aura_ai_products_total`

## 9. Deployment

`docker-compose.dev.yml` now includes:

- `mysql`
- `redis`
- `rabbitmq`
- `vector-db` (`pgvector/pgvector`)
- `backend`
- `ai-service`
- `prometheus`
- `grafana`

## 10. Production Checklist

- Add real request correlation ID propagation across frontend/backend/queue.
- Add explicit feature flag service for experiments and rollout.
- Add batch jobs for nightly retraining and drift snapshots.
- Add integration tests covering event ingest, retry, and cache refresh flows.
