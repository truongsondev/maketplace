from __future__ import annotations

import math
import os
from collections import Counter, defaultdict
from contextlib import contextmanager
from datetime import datetime
from typing import Any, Iterable

import numpy as np
import psycopg
from fastapi import FastAPI
from fastapi.responses import PlainTextResponse
from psycopg.types.json import Jsonb
from pydantic import BaseModel, Field

from .virtual_try_on.routes import router as virtual_try_on_router

try:
    from sentence_transformers import SentenceTransformer
except Exception:  # pragma: no cover
    SentenceTransformer = None

VECTOR_DB_URL = os.getenv(
    "VECTOR_DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/recommendation",
)
EMBEDDING_DIMENSIONS = int(os.getenv("EMBEDDING_DIMENSIONS", "384"))

app = FastAPI(title="Aura AI Recommendation Service", version="1.1.0")
app.include_router(virtual_try_on_router)


class ProductDocument(BaseModel):
    product_id: str
    title: str
    description: str = ""
    category: str | None = None
    attributes: dict[str, Any] = Field(default_factory=dict)


class UserEvent(BaseModel):
    user_id: str | None = None
    product_id: str | None = None
    event_type: str
    weight: float = 1.0


class TrainRequest(BaseModel):
    products: list[ProductDocument]
    events: list[UserEvent] = Field(default_factory=list)


class HybridRecommendationRequest(BaseModel):
    user_id: str | None = None
    session_id: str | None = None
    context_product_ids: list[str] = Field(default_factory=list)
    candidate_product_ids: list[str] = Field(default_factory=list)
    user_profile: dict[str, Any] | None = None
    limit: int = 12


class EmbedProductsRequest(BaseModel):
    products: list[ProductDocument]


def vector_literal(vector: np.ndarray) -> str:
    return "[" + ",".join(f"{float(value):.8f}" for value in vector.tolist()) + "]"


class VectorStore:
    def __init__(self, database_url: str) -> None:
        self.database_url = database_url

    @contextmanager
    def connection(self):
        connection = psycopg.connect(self.database_url)
        try:
            yield connection
        finally:
            connection.close()

    def initialize(self) -> None:
        with self.connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute("CREATE EXTENSION IF NOT EXISTS vector")
                cursor.execute(
                    f"""
                    CREATE TABLE IF NOT EXISTS product_embeddings (
                        product_id TEXT PRIMARY KEY,
                        title TEXT NOT NULL,
                        category TEXT NULL,
                        embedding vector({EMBEDDING_DIMENSIONS}) NOT NULL,
                        metadata JSONB NOT NULL DEFAULT '{{}}'::jsonb,
                        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    )
                    """
                )
                cursor.execute(
                    """
                    CREATE INDEX IF NOT EXISTS product_embeddings_vector_idx
                    ON product_embeddings
                    USING ivfflat (embedding vector_cosine_ops)
                    """
                )
            connection.commit()

    def upsert_embeddings(self, rows: Iterable[dict[str, Any]]) -> int:
        payload = list(rows)
        if not payload:
            return 0

        with self.connection() as connection:
            with connection.cursor() as cursor:
                for row in payload:
                    cursor.execute(
                        f"""
                        INSERT INTO product_embeddings (product_id, title, category, embedding, metadata, updated_at)
                        VALUES (%s, %s, %s, %s::vector, %s::jsonb, NOW())
                        ON CONFLICT (product_id)
                        DO UPDATE SET
                            title = EXCLUDED.title,
                            category = EXCLUDED.category,
                            embedding = EXCLUDED.embedding,
                            metadata = EXCLUDED.metadata,
                            updated_at = NOW()
                        """,
                        (
                            row["product_id"],
                            row["title"],
                            row["category"],
                            row["embedding"],
                            Jsonb(row["metadata"]),
                        ),
                    )
            connection.commit()

        return len(payload)

    def search_similar(
        self,
        query_vector: np.ndarray,
        candidate_product_ids: list[str],
        exclude_product_ids: list[str],
        limit: int,
    ) -> list[dict[str, Any]]:
        vector = vector_literal(query_vector)
        candidate_filter = candidate_product_ids if candidate_product_ids else None
        exclude_filter = exclude_product_ids if exclude_product_ids else None

        with self.connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT
                        product_id,
                        title,
                        category,
                        1 - (embedding <=> %s::vector) AS similarity
                    FROM product_embeddings
                    WHERE (%s::text[] IS NULL OR product_id = ANY(%s))
                      AND (%s::text[] IS NULL OR NOT (product_id = ANY(%s)))
                    ORDER BY embedding <=> %s::vector
                    LIMIT %s
                    """,
                    (
                        vector,
                        candidate_filter,
                        candidate_filter,
                        exclude_filter,
                        exclude_filter,
                        vector,
                        limit,
                    ),
                )
                rows = cursor.fetchall()

        return [
            {
                "product_id": row[0],
                "title": row[1],
                "category": row[2],
                "score": round(float(row[3] or 0.0), 6),
            }
            for row in rows
        ]


class InMemoryRecommendationStore:
    def __init__(self, vector_store: VectorStore) -> None:
        self.vector_store = vector_store
        self.products: dict[str, ProductDocument] = {}
        self.product_vectors: dict[str, np.ndarray] = {}
        self.user_preferences: dict[str, Counter[str]] = defaultdict(Counter)
        self.popularity: Counter[str] = Counter()
        self.model_name = "hashing-baseline"
        self.preferred_model_name = "sentence-transformers/all-MiniLM-L6-v2"
        self.encoder = None

    def initialize(self) -> None:
        self.vector_store.initialize()

    def _load_encoder(self) -> None:
        if self.encoder or SentenceTransformer is None:
            return

        try:
            self.encoder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
            self.model_name = "all-MiniLM-L6-v2"
        except Exception:
            self.encoder = None
            self.model_name = "hashing-baseline"

    def _hash_embed(self, text: str) -> np.ndarray:
        vector = np.zeros(EMBEDDING_DIMENSIONS, dtype=float)
        tokens = [token.strip().lower() for token in text.split() if token.strip()]
        if not tokens:
            return vector

        for token in tokens:
            index = hash(token) % EMBEDDING_DIMENSIONS
            vector[index] += 1.0

        norm = np.linalg.norm(vector)
        return vector if norm == 0 else vector / norm

    def _embed_text(self, text: str) -> np.ndarray:
        self._load_encoder()
        if self.encoder is not None:
            vector = self.encoder.encode(text, normalize_embeddings=True)
            return np.array(vector, dtype=float)
        return self._hash_embed(text)

    def _document_text(self, product: ProductDocument) -> str:
        return " ".join(
            [
                product.title,
                product.description,
                product.category or "",
                " ".join(f"{key} {value}" for key, value in product.attributes.items()),
            ]
        ).strip()

    def train(self, request: TrainRequest) -> dict[str, Any]:
        self.products = {product.product_id: product for product in request.products}
        self.product_vectors = {}
        self.user_preferences = defaultdict(Counter)
        self.popularity = Counter()

        for product in request.products:
            self.product_vectors[product.product_id] = self._embed_text(self._document_text(product))

        for event in request.events:
            if event.product_id:
                self.popularity[event.product_id] += max(1.0, event.weight)
            if event.user_id and event.product_id:
                self.user_preferences[event.user_id][event.product_id] += max(1.0, event.weight)

        return {
            "status": "trained",
            "products": len(self.products),
            "events": len(request.events),
            "model_name": self.model_name,
            "trained_at": datetime.utcnow().isoformat(),
        }

    def embed_products(self, request: EmbedProductsRequest) -> dict[str, Any]:
        rows: list[dict[str, Any]] = []
        for product in request.products:
            vector = self._embed_text(self._document_text(product))
            self.products[product.product_id] = product
            self.product_vectors[product.product_id] = vector
            rows.append(
                {
                    "product_id": product.product_id,
                    "title": product.title,
                    "category": product.category,
                    "embedding": vector_literal(vector),
                    "metadata": {
                        "description": product.description,
                        "attributes": product.attributes,
                        "model_name": self.model_name,
                    },
                }
            )

        upserted = self.vector_store.upsert_embeddings(rows)

        return {
            "generated_at": datetime.utcnow().isoformat(),
            "model_name": self.model_name,
            "upserted": upserted,
            "items": [
                {
                    "product_id": row["product_id"],
                    "dimensions": EMBEDDING_DIMENSIONS,
                }
                for row in rows
            ],
        }

    def recommend(self, request: HybridRecommendationRequest) -> dict[str, Any]:
        candidate_ids = request.candidate_product_ids or list(self.products.keys())
        candidate_ids = [product_id for product_id in candidate_ids if product_id in self.products]

        context_product_ids = list(dict.fromkeys(request.context_product_ids))
        if request.user_id:
            context_product_ids.extend(
                [
                    product_id
                    for product_id, _ in self.user_preferences.get(request.user_id, {}).most_common(8)
                    if product_id not in context_product_ids
                ]
            )

        context_vectors = [
            self.product_vectors[product_id]
            for product_id in context_product_ids
            if product_id in self.product_vectors
        ]

        if context_vectors:
            average_vector = np.mean(context_vectors, axis=0)
            norm = np.linalg.norm(average_vector)
            if norm > 0:
                average_vector = average_vector / norm
            vector_hits = self.vector_store.search_similar(
                average_vector,
                candidate_ids,
                context_product_ids,
                request.limit * 3,
            )
        else:
            vector_hits = []

        vector_map = {item["product_id"]: item for item in vector_hits}
        scored_items: list[dict[str, Any]] = []
        fallback_candidates = candidate_ids if candidate_ids else list(self.products.keys())

        for product_id in fallback_candidates:
            if product_id in context_product_ids:
                continue

            vector_score = vector_map.get(product_id, {}).get("score", 0.0)
            popularity_score = math.log1p(self.popularity.get(product_id, 0.0))
            final_score = (vector_score * 0.75) + (popularity_score * 0.25)

            scored_items.append(
                {
                    "product_id": product_id,
                    "score": round(float(final_score), 6),
                    "vector_score": round(float(vector_score), 6),
                    "popularity_score": round(float(popularity_score), 6),
                }
            )

        items = sorted(scored_items, key=lambda item: item["score"], reverse=True)[: request.limit]
        return {
            "generated_at": datetime.utcnow().isoformat(),
            "strategy": "pgvector_hybrid_content_popularity",
            "items": items,
        }


vector_store = VectorStore(VECTOR_DB_URL)
store = InMemoryRecommendationStore(vector_store)


@app.on_event("startup")
def startup() -> None:
    store.initialize()


@app.get("/health")
def health() -> dict[str, Any]:
        return {
            "status": "ok",
            "service": "aura-ai-service",
            "model_name": store.model_name,
            "preferred_model_name": store.preferred_model_name,
            "model_loaded": store.encoder is not None,
            "product_count": len(store.products),
            "vector_db": "pgvector",
        }


@app.get("/metrics", response_class=PlainTextResponse)
def metrics() -> str:
    return "\n".join(
        [
            "# HELP aura_ai_products_total Number of indexed products",
            "# TYPE aura_ai_products_total gauge",
            f"aura_ai_products_total {len(store.products)}",
            "# HELP aura_ai_popularity_events_total Total popularity events absorbed",
            "# TYPE aura_ai_popularity_events_total gauge",
            f"aura_ai_popularity_events_total {sum(store.popularity.values())}",
            "",
        ]
    )


@app.post("/train")
def train(request: TrainRequest) -> dict[str, Any]:
    return store.train(request)


@app.post("/recommend/hybrid")
def recommend_hybrid(request: HybridRecommendationRequest) -> dict[str, Any]:
    return store.recommend(request)


@app.post("/embed/products")
def embed_products(request: EmbedProductsRequest) -> dict[str, Any]:
    return store.embed_products(request)
