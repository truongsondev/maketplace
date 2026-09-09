// @ts-nocheck
import { redis } from '../../../../infrastructure/database';
import { metricsRegistry } from '../../../../shared/server/prometheus';
import { createLogger } from '../../../../shared/util/logger';
import {
  RecommendationAnalyticsResult,
  RecommendationEventPayload,
  RecommendationFeedResult,
  RecommendationItem,
} from '../../entities/recommendation.types';
import { IRecommendationRepository } from '../../applications/ports/output/recommendation.repository';

const logger = createLogger('PrismaRecommendationRepository');

const eventCounter = metricsRegistry.counter(
  'recommendation_events_total',
  'Recommendation events',
  ['event_type', 'source'],
);
const cacheHitCounter = metricsRegistry.counter(
  'recommendation_cache_hits_total',
  'Recommendation cache hits',
  ['feed'],
);
const generationLatency = metricsRegistry.histogram(
  'recommendation_generation_latency_ms',
  'Recommendation generation latency',
  [5, 20, 50, 100, 250, 500, 1000, 2000],
  ['feed'],
);
const aiLatency = metricsRegistry.histogram(
  'recommendation_ai_latency_ms',
  'Recommendation AI service latency',
  [20, 50, 100, 250, 500, 1000, 3000, 5000],
  ['operation'],
);
const aiFallbackCounter = metricsRegistry.counter(
  'recommendation_ai_fallback_total',
  'Recommendation AI fallback count',
  ['feed'],
);

type ProductCardRecord = RecommendationFeedResult['items'][number];
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export class PrismaRecommendationRepository implements IRecommendationRepository {
  constructor(private readonly prisma: any) {}

  async getHomeRecommendations(limit: number, sessionId: string): Promise<RecommendationItem[]> {
    return this.withFeedLatency('home', async () => {
      const cacheKey = `recommendations:home:v2:${sessionId}:${limit}`;
      const cached = await this.getCachedItems(cacheKey, 'home', limit);
      if (cached.length > 0) return cached;

      const searchIntentItems = await this.getSearchIntentRecommendations({
        sessionId,
        anonymousSessionOnly: true,
        limit: limit * 2,
      });

      const sessionRows = await this.prisma.$queryRaw<Array<{ productId: string; score: number }>>`
        SELECT product_id as productId,
          SUM(CASE event_type
            WHEN 'ADD_TO_CART' THEN 3
            WHEN 'FAVORITE_PRODUCT' THEN 2.5
            WHEN 'VIEW_PRODUCT' THEN 1
            ELSE 0.5
          END) as score
        FROM recommendation_events
        WHERE session_id = ${sessionId}
          AND user_id IS NULL
          AND event_type IN ('VIEW_PRODUCT', 'ADD_TO_CART', 'FAVORITE_PRODUCT')
          AND product_id IS NOT NULL
          AND occurred_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
        GROUP BY product_id
        ORDER BY score DESC
        LIMIT ${limit * 2}
      `;

      const hotItems = await this.getHotProductRecommendations(limit * 2);
      const eventTrendingItems = await this.getEventTrendingRecommendations(limit * 2);
      const contextItems = this.mergeRecommendationScores(
        [
          ...hotItems,
          ...eventTrendingItems,
          ...searchIntentItems,
          ...sessionRows.map((row) => ({
            productId: row.productId,
            score: Number(row.score),
            reason: 'Dựa trên hành vi trong phiên hiện tại',
            source: 'session_behavior',
          })),
        ],
        limit,
      );

      if (contextItems.length > 0) {
        await this.persistCache('home', cacheKey, null, null, sessionId, contextItems, 900);
        return contextItems;
      }

      const finalItems = await this.getLatestProductsFallback(limit, 'home_catalog_fallback');

      await this.persistCache('home', cacheKey, null, null, sessionId, finalItems, 900);
      return finalItems;
    });
  }

  async getProductRecommendations(productId: string, limit: number): Promise<RecommendationItem[]> {
    return this.withFeedLatency('product', async () => {
      const cacheKey = `recommendations:product:${productId}:${limit}`;
      const cached = await this.getCachedItems(cacheKey, 'product', limit);
      if (cached.length > 0) return cached;

      const similarityRows = await this.prisma.$queryRaw<
        Array<{ relatedProductId: string; score: number; algorithm: string }>
      >`
        SELECT related_product_id as relatedProductId, score, algorithm
        FROM product_similarities
        WHERE product_id = ${productId}
        ORDER BY score DESC
        LIMIT ${limit * 2}
      `;

      const items: RecommendationItem[] = await this.getAiVectorRecommendations(
        [productId],
        limit * 2,
        [],
        'product',
      );

      const merged = this.mergeRecommendationScores(
        [
          ...items.map((item) => ({
            ...item,
            reason: 'Tương đồng bằng pgvector',
            source: 'pgvector',
          })),
          ...similarityRows.map((row) => ({
            productId: row.relatedProductId,
            score: Number(row.score),
            reason: 'Tương đồng về hành vi mua sắm',
            source: row.algorithm,
          })),
          ...(await this.getSameCategoryFallback(productId, limit * 2)),
        ],
        limit * 3,
      );

      const finalItems = this.uniqueTop(merged, limit, [productId]);
      await this.persistCache('product', cacheKey, null, productId, null, finalItems, 1800);
      return finalItems;
    });
  }

  async getCartRecommendations(userId: string, limit: number): Promise<RecommendationItem[]> {
    return this.withFeedLatency('cart', async () => {
      const cacheKey = `recommendations:cart:${userId}:${limit}`;
      const cached = await this.getCachedItems(cacheKey, 'cart', limit);
      if (cached.length > 0) return cached;

      const cart = await this.prisma.cart.findUnique({
        where: { userId },
        include: { items: true },
      });

      if (!cart || cart.items.length === 0) {
        return [];
      }

      const excluded = cart.items.map((item) => item.productId);
      const aiItems = (
        await this.getAiVectorRecommendations(excluded, limit * 3, excluded, 'cart')
      ).map((item) => ({
        ...item,
        reason: 'AI gợi ý phù hợp với các sản phẩm trong giỏ',
        source: 'cart_ai',
      }));
      const sameCategoryItems = await this.getSameCategoryFallbackForProducts(excluded, limit * 3);
      const relatedItems = await this.getRelatedRecommendationsForProducts(
        excluded,
        limit * 3,
        excluded,
      );
      const finalItems = this.uniqueTop(
        [...aiItems, ...relatedItems, ...sameCategoryItems],
        limit,
        excluded,
      );
      await this.persistCache('cart', cacheKey, userId, null, null, finalItems, 600);
      return finalItems;
    });
  }

  async getPersonalizedRecommendations(
    userId: string,
    sessionId: string,
    limit: number,
  ): Promise<RecommendationItem[]> {
    return this.withFeedLatency('personalized', async () => {
      const cacheKey = `recommendations:personalized:v4:${userId}:${sessionId}:${limit}`;
      const cached = await this.getCachedItems(cacheKey, 'personalized', limit);
      if (cached.length > 0) return cached;

      const recentEvents = await this.prisma.$queryRaw<Array<{ productId: string; score: number }>>`
        SELECT product_id as productId,
          SUM(
            (CASE event_type
              WHEN 'PURCHASE' THEN 4
              WHEN 'ADD_TO_CART' THEN 3
              WHEN 'FAVORITE_PRODUCT' THEN 2.5
              WHEN 'VIEW_PRODUCT' THEN 1
              ELSE 0.5
            END)
            * CASE WHEN user_id = ${userId} THEN 1.35 ELSE 1 END
          ) as score
        FROM recommendation_events
        WHERE user_id = ${userId}
          AND product_id IS NOT NULL
          AND occurred_at >= DATE_SUB(NOW(), INTERVAL 45 DAY)
        GROUP BY product_id
        ORDER BY score DESC
        LIMIT 10
      `;
      const searchIntentItems = await this.getSearchIntentRecommendations({
        userId,
        limit: limit * 3,
      });

      const contextIds = recentEvents.map((row) => row.productId);
      const excludedProductIds = await this.getPersonalizedExcludedProductIds(userId, contextIds);
      const aiItems = await this.getAiVectorRecommendations(
        contextIds,
        limit * 4,
        excludedProductIds,
        'personalized',
        userId,
      );
      const relatedItems = await this.getRelatedRecommendationsForProducts(
        contextIds,
        limit * 4,
        excludedProductIds,
      );
      const categoryItems = await this.getSameCategoryFallbackForProducts(contextIds, limit * 3);

      const ownSignals = recentEvents.map((row) => ({
        productId: row.productId,
        score: Number(row.score) * 1.2,
        reason: 'Dựa trên hành vi gần đây của bạn',
        source: 'recent_behavior',
      }));

      let finalItems = this.uniqueTop(
        [...searchIntentItems, ...aiItems, ...relatedItems, ...categoryItems, ...ownSignals],
        limit,
        excludedProductIds,
      );
      if (finalItems.length < limit) {
        const fallbackItems = await this.getLatestProductsFallback(
          limit * 2,
          'personalized_catalog_fallback',
        );
        finalItems = this.uniqueTop([...finalItems, ...fallbackItems], limit, excludedProductIds);
      }

      await this.persistCache('personalized', cacheKey, userId, null, sessionId, finalItems, 900);
      return finalItems;
    });
  }

  async getProductCards(items: RecommendationItem[]): Promise<ProductCardRecord[]> {
    if (items.length === 0) return [];

    const products = await this.prisma.product.findMany({
      where: {
        id: { in: items.map((item) => item.productId) },
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        basePrice: true,
        isSale: true,
        variants: {
          where: { isDeleted: false },
          orderBy: { price: 'asc' },
          take: 1,
          select: { price: true },
        },
        images: {
          take: 1,
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
          select: { url: true },
        },
      },
    });

    const productMap = new Map(products.map((product) => [product.id, product]));

    const cards = items
      .map((item) => {
        const product = productMap.get(item.productId);
        if (!product) return null;

        return {
          id: product.id,
          name: product.name,
          imageUrl: product.images[0]?.url ?? null,
          minPrice: Number(product.variants[0]?.price ?? product.basePrice ?? 0),
          isNew: false,
          isSale: product.isSale,
          score: item.score,
          reason: item.reason,
          source: item.source,
        };
      })
      .filter(Boolean) as ProductCardRecord[];

    return cards;
  }

  async saveTrackingEvent(
    event: RecommendationEventPayload,
  ): Promise<{ accepted: boolean; duplicated: boolean }> {
    try {
      await this.prisma.$executeRawUnsafe(
        `
          INSERT INTO recommendation_events (
            id,
            event_type,
            user_id,
            session_id,
            product_id,
            order_id,
            search_query,
            dedupe_key,
            source,
            placement,
            metadata,
            occurred_at,
            processed_at,
            created_at
          )
          VALUES (
            UUID(),
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            NOW()
          )
        `,
        event.eventType,
        event.userId ?? null,
        event.sessionId,
        event.productId ?? null,
        event.orderId ?? null,
        event.searchQuery ?? null,
        event.dedupeKey,
        event.source ?? null,
        event.placement ?? null,
        event.metadata ? JSON.stringify(event.metadata) : null,
        new Date(event.occurredAt),
        new Date(),
      );
      eventCounter.inc({
        event_type: event.eventType,
        source: event.source ?? 'direct',
      });
      await this.bumpRealtimeSignals(event);
      await this.invalidateRealtimeCaches(event);
      return { accepted: true, duplicated: false };
    } catch (error: any) {
      if (error?.code === 'P2002' || error?.code === 'ER_DUP_ENTRY' || error?.errno === 1062) {
        return { accepted: true, duplicated: true };
      }

      throw error;
    }
  }

  async refreshArtifacts(): Promise<void> {
    logger.info('Refreshing recommendation artifacts');

    const cooccurrenceRows = await this.prisma.$queryRaw<
      Array<{ productId: string; relatedProductId: string; score: number }>
    >`
      SELECT
        oi1.product_id as productId,
        oi2.product_id as relatedProductId,
        COUNT(*) * 1.0 as score
      FROM order_items oi1
      INNER JOIN order_items oi2
        ON oi1.order_id = oi2.order_id
        AND oi1.product_id <> oi2.product_id
      GROUP BY oi1.product_id, oi2.product_id
      HAVING COUNT(*) >= 1
      ORDER BY score DESC
      LIMIT 500
    `;

    await this.prisma.$executeRaw`
      DELETE FROM product_similarities
      WHERE algorithm = 'cooccurrence'
    `;

    if (cooccurrenceRows.length > 0) {
      const refreshedAt = new Date().toISOString();
      const valuePlaceholders = cooccurrenceRows
        .map(() => '(?, ?, ?, ?, ?, ?, NOW(), NOW())')
        .join(', ');
      const values = cooccurrenceRows.flatMap((row, index) => [
        row.productId,
        row.relatedProductId,
        'cooccurrence',
        row.score,
        index + 1,
        JSON.stringify({ refreshedAt }),
      ]);

      await this.prisma.$executeRawUnsafe(
        `
          INSERT INTO product_similarities (
            product_id,
            related_product_id,
            algorithm,
            score,
            \`rank\`,
            metadata,
            created_at,
            updated_at
          )
          VALUES ${valuePlaceholders}
        `,
        ...values,
      );
    }

    await this.syncAiArtifacts();
    const homeItems = await this.getLatestProductsFallback(12, 'home_catalog_fallback');
    await this.persistCache(
      'home',
      'recommendations:home:global:12',
      null,
      null,
      'global',
      homeItems,
      3600,
    );
  }

  async getAnalytics(fromDate?: string, toDate?: string): Promise<RecommendationAnalyticsResult> {
    const start = fromDate ? new Date(fromDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = toDate ? new Date(toDate) : new Date();

    const [totalsRows, breakdownRows, topProductsRows] = await Promise.all([
      this.prisma.$queryRaw<
        Array<{
          totalEvents: bigint | number;
          uniqueSessions: bigint | number;
          productViews: bigint | number;
          purchases: bigint | number;
        }>
      >`
        SELECT
          COUNT(*) as totalEvents,
          COUNT(DISTINCT session_id) as uniqueSessions,
          SUM(CASE WHEN event_type = 'VIEW_PRODUCT' THEN 1 ELSE 0 END) as productViews,
          SUM(CASE WHEN event_type = 'PURCHASE' THEN 1 ELSE 0 END) as purchases
        FROM recommendation_events
        WHERE occurred_at BETWEEN ${start} AND ${end}
      `,
      this.prisma.$queryRaw<Array<{ eventType: string; total: bigint | number }>>`
        SELECT event_type as eventType, COUNT(*) as total
        FROM recommendation_events
        WHERE occurred_at BETWEEN ${start} AND ${end}
        GROUP BY event_type
        ORDER BY total DESC
      `,
      this.prisma.$queryRaw<Array<{ productId: string; name: string; total: bigint | number }>>`
        SELECT re.product_id as productId, p.name as name, COUNT(*) as total
        FROM recommendation_events re
        INNER JOIN products p ON p.id = re.product_id
        WHERE re.product_id IS NOT NULL
          AND re.occurred_at BETWEEN ${start} AND ${end}
        GROUP BY re.product_id, p.name
        ORDER BY total DESC
        LIMIT 10
      `,
    ]);

    const totals = totalsRows[0];

    return {
      generatedAt: new Date().toISOString(),
      totals: {
        events: Number(totals?.totalEvents ?? 0),
        uniqueSessions: Number(totals?.uniqueSessions ?? 0),
        productViews: Number(totals?.productViews ?? 0),
        purchases: Number(totals?.purchases ?? 0),
      },
      eventBreakdown: breakdownRows.map((row) => ({
        eventType: row.eventType,
        total: Number(row.total),
      })),
      topProducts: topProductsRows.map((row) => ({
        productId: row.productId,
        name: row.name,
        total: Number(row.total),
      })),
    };
  }

  private async getHotProductRecommendations(limit: number): Promise<RecommendationItem[]> {
    const raw = await redis.zrevrange('recommendations:hot-products', 0, limit - 1, 'WITHSCORES');
    const items: RecommendationItem[] = [];

    for (let index = 0; index < raw.length; index += 2) {
      const productId = raw[index];
      const score = Number(raw[index + 1] ?? 0);
      if (!productId) continue;

      items.push({
        productId,
        score: score + Math.max(0.1, limit - index / 2),
        reason: 'Sản phẩm đang được quan tâm nhiều',
        source: 'hot_products',
      });
    }

    return items;
  }

  private async getEventTrendingRecommendations(limit: number): Promise<RecommendationItem[]> {
    const rows = await this.prisma.$queryRaw<
      Array<{ productId: string; score: number; views: number; purchases: number }>
    >`
      SELECT product_id as productId,
        SUM(CASE event_type
          WHEN 'PURCHASE' THEN 5
          WHEN 'ADD_TO_CART' THEN 3
          WHEN 'FAVORITE_PRODUCT' THEN 2
          WHEN 'VIEW_PRODUCT' THEN 1
          ELSE 0
        END) as score,
        SUM(CASE WHEN event_type = 'VIEW_PRODUCT' THEN 1 ELSE 0 END) as views,
        SUM(CASE WHEN event_type = 'PURCHASE' THEN 1 ELSE 0 END) as purchases
      FROM recommendation_events
      WHERE product_id IS NOT NULL
        AND event_type IN ('VIEW_PRODUCT', 'ADD_TO_CART', 'FAVORITE_PRODUCT', 'PURCHASE')
        AND occurred_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY product_id
      ORDER BY score DESC, purchases DESC, views DESC
      LIMIT ${limit}
    `;

    return rows.map((row) => ({
      productId: row.productId,
      score: Number(row.score),
      reason: Number(row.purchases) > 0 ? 'Được mua nhiều gần đây' : 'Được xem nhiều gần đây',
      source: Number(row.purchases) > 0 ? 'top_purchased' : 'top_viewed',
    }));
  }

  private async getRelatedRecommendationsForProducts(
    productIds: string[],
    limit: number,
    excludedProductIds: string[] = [],
  ): Promise<RecommendationItem[]> {
    const uniqueProductIds = Array.from(new Set(productIds.filter(Boolean)));
    if (uniqueProductIds.length === 0) return [];

    const excluded = Array.from(new Set([...uniqueProductIds, ...excludedProductIds]));
    const rows = await this.prisma.productSimilarity.findMany({
      where: {
        productId: { in: uniqueProductIds },
        relatedProductId: { notIn: excluded },
      },
      select: {
        relatedProductId: true,
        score: true,
        algorithm: true,
      },
      orderBy: [{ score: 'desc' }, { rank: 'asc' }],
      take: limit * 2,
    });

    return this.uniqueTop(
      rows.map((row) => ({
        productId: row.relatedProductId,
        score: Number(row.score),
        reason: 'Liên quan theo hành vi mua sắm',
        source: row.algorithm,
      })),
      limit,
      excluded,
    );
  }

  private async getPersonalizedExcludedProductIds(
    userId: string,
    contextIds: string[],
  ): Promise<string[]> {
    const [cart, purchasedRows] = await Promise.all([
      this.prisma.cart.findUnique({
        where: { userId },
        include: { items: { select: { productId: true } } },
      }),
      this.prisma.$queryRaw<Array<{ productId: string }>>`
        SELECT DISTINCT oi.product_id as productId
        FROM orders o
        INNER JOIN order_items oi ON oi.order_id = o.id
        WHERE o.user_id = ${userId}
          AND o.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
      `,
    ]);

    return Array.from(
      new Set([
        ...contextIds,
        ...(cart?.items ?? []).map((item) => item.productId),
        ...purchasedRows.map((row) => row.productId),
      ]),
    );
  }

  private async getSameCategoryFallback(
    productId: string,
    limit: number,
  ): Promise<RecommendationItem[]> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        productTypeId: true,
        categories: {
          select: {
            categoryId: true,
            category: {
              select: {
                id: true,
                parentId: true,
              },
            },
          },
        },
      },
    });

    if (!product) return [];

    const directCategoryIds = product.categories.map((item) => item.categoryId);
    const parentCategoryIds = product.categories
      .map((item) => item.category?.parentId)
      .filter(Boolean) as string[];
    const childCategories =
      directCategoryIds.length > 0 || parentCategoryIds.length > 0
        ? await this.prisma.category.findMany({
            where: {
              parentId: {
                in: [...directCategoryIds, ...parentCategoryIds],
              },
              deletedAt: null,
            },
            select: { id: true },
          })
        : [];
    const relatedCategoryIds = Array.from(
      new Set([
        ...directCategoryIds,
        ...parentCategoryIds,
        ...childCategories.map((category) => category.id),
      ]),
    );

    const relatedByCategory = await this.prisma.product.findMany({
      where: {
        id: { not: productId },
        isDeleted: false,
        ...(relatedCategoryIds.length > 0
          ? {
              categories: {
                some: {
                  categoryId: { in: relatedCategoryIds },
                },
              },
            }
          : {
              id: '__no_category_match__',
            }),
      },
      select: { id: true },
      take: limit,
      orderBy: [{ isSale: 'desc' }, { updatedAt: 'desc' }],
    });

    const categoryItems = relatedByCategory.map((item, index) => ({
      productId: item.id,
      score: Math.max(0.1, limit - index),
      reason: 'Cùng danh mục đang xem',
      source: 'category_fallback',
    }));

    if (categoryItems.length >= limit || !product.productTypeId) {
      return categoryItems;
    }

    const relatedByProductType = await this.prisma.product.findMany({
      where: {
        id: {
          notIn: [productId, ...categoryItems.map((item) => item.productId)],
        },
        isDeleted: false,
        productTypeId: product.productTypeId,
      },
      select: { id: true },
      take: limit - categoryItems.length,
      orderBy: [{ isSale: 'desc' }, { updatedAt: 'desc' }],
    });

    return [
      ...categoryItems,
      ...relatedByProductType.map((item, index) => ({
        productId: item.id,
        score: Math.max(0.1, limit - categoryItems.length - index),
        reason: 'Cùng nhóm sản phẩm',
        source: 'product_type_fallback',
      })),
    ];
  }

  private async getRelatedCategoryIdsForProducts(productIds: string[]): Promise<string[]> {
    if (productIds.length === 0) return [];

    const productCategories = await this.prisma.productCategory.findMany({
      where: {
        productId: { in: productIds },
      },
      select: {
        categoryId: true,
        category: {
          select: {
            parentId: true,
          },
        },
      },
    });

    const directCategoryIds = productCategories.map((item) => item.categoryId);
    const parentCategoryIds = productCategories
      .map((item) => item.category?.parentId)
      .filter(Boolean) as string[];
    const childCategories =
      directCategoryIds.length > 0 || parentCategoryIds.length > 0
        ? await this.prisma.category.findMany({
            where: {
              parentId: {
                in: [...directCategoryIds, ...parentCategoryIds],
              },
              deletedAt: null,
            },
            select: { id: true },
          })
        : [];

    return Array.from(
      new Set([
        ...directCategoryIds,
        ...parentCategoryIds,
        ...childCategories.map((category) => category.id),
      ]),
    );
  }

  private async getSameCategoryFallbackForProducts(
    productIds: string[],
    limit: number,
  ): Promise<RecommendationItem[]> {
    if (productIds.length === 0) return [];

    const relatedCategoryIds = await this.getRelatedCategoryIdsForProducts(productIds);

    if (relatedCategoryIds.length === 0) return [];

    const products = await this.prisma.product.findMany({
      where: {
        id: { notIn: productIds },
        isDeleted: false,
        categories: {
          some: {
            categoryId: { in: relatedCategoryIds },
          },
        },
      },
      select: { id: true },
      take: limit,
      orderBy: [{ isSale: 'desc' }, { updatedAt: 'desc' }],
    });

    return products.map((product, index) => ({
      productId: product.id,
      score: Math.max(0.1, limit - index),
      reason: 'Cùng danh mục với sản phẩm trong giỏ',
      source: 'cart_category_fallback',
    }));
  }

  private async getSearchIntentRecommendations({
    userId,
    sessionId,
    anonymousSessionOnly = false,
    limit,
  }: {
    userId?: string;
    sessionId?: string;
    anonymousSessionOnly?: boolean;
    limit: number;
  }): Promise<RecommendationItem[]> {
    const clauses: string[] = [];
    const values: Array<string | Date | number> = [];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    if (userId) {
      clauses.push('user_id = ?');
      values.push(userId);
    }

    if (sessionId) {
      clauses.push(
        userId || anonymousSessionOnly ? '(session_id = ? AND user_id IS NULL)' : 'session_id = ?',
      );
      values.push(sessionId);
    }

    if (clauses.length === 0) {
      return [];
    }

    const searchRows = await this.prisma.$queryRawUnsafe<
      Array<{ searchQuery: string; total: number }>
    >(
      `
        SELECT search_query as searchQuery, COUNT(*) as total
        FROM recommendation_events
        WHERE event_type = 'SEARCH_QUERY'
          AND search_query IS NOT NULL
          AND search_query <> ''
          AND occurred_at >= ?
          AND (${clauses.join(' OR ')})
        GROUP BY search_query
        ORDER BY total DESC, MAX(occurred_at) DESC
        LIMIT ?
      `,
      startDate,
      ...values,
      Math.max(3, Math.min(limit, 8)),
    );

    if (searchRows.length === 0) {
      return [];
    }

    const collected: RecommendationItem[] = [];

    for (const [termIndex, row] of searchRows.entries()) {
      const term = row.searchQuery?.trim();
      if (!term) continue;

      const pattern = `%${term}%`;
      const matchedProducts = await this.prisma.$queryRaw<Array<{ productId: string }>>`
        SELECT id as productId
        FROM products
        WHERE is_deleted = false
          AND (
            LOWER(name) LIKE LOWER(${pattern})
            OR LOWER(COALESCE(description, '')) LIKE LOWER(${pattern})
          )
        ORDER BY updated_at DESC
        LIMIT ${Math.max(3, Math.ceil(limit / 2))}
      `;

      matchedProducts.forEach((product, productIndex) => {
        const rankPenalty = termIndex * 0.75 + productIndex * 0.25;
        collected.push({
          productId: product.productId,
          score: Math.max(0.5, Number(row.total) * 3 - rankPenalty),
          reason: `Dựa trên tìm kiếm "${term}"`,
          source: 'search_intent',
        });
      });
    }

    return this.uniqueTop(collected, limit);
  }

  private mergeRecommendationScores(
    items: RecommendationItem[],
    limit: number,
  ): RecommendationItem[] {
    const scores = new Map<string, RecommendationItem>();

    for (const item of items) {
      const existing = scores.get(item.productId);
      if (!existing || item.score > existing.score) {
        scores.set(item.productId, item);
      } else {
        existing.score += item.score * 0.2;
      }
    }

    return Array.from(scores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private uniqueTop(
    items: RecommendationItem[],
    limit: number,
    excludedProductIds: string[] = [],
  ): RecommendationItem[] {
    const excluded = new Set(excludedProductIds);
    const unique = new Map<string, RecommendationItem>();

    items
      .filter((item) => !excluded.has(item.productId))
      .sort((a, b) => b.score - a.score)
      .forEach((item) => {
        if (!unique.has(item.productId)) {
          unique.set(item.productId, item);
        }
      });

    return Array.from(unique.values()).slice(0, limit);
  }

  private async persistCache(
    modelKind: 'home' | 'product' | 'cart' | 'personalized',
    cacheKey: string,
    userId: string | null,
    productId: string | null,
    sessionId: string | null,
    items: RecommendationItem[],
    ttlSeconds: number,
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    await redis.set(cacheKey, JSON.stringify(items), 'EX', ttlSeconds);

    const resolvedModelKind =
      modelKind === 'home'
        ? 'TRENDING'
        : modelKind === 'product'
          ? 'ITEM_SIMILARITY'
          : modelKind === 'cart'
            ? 'SESSION_BASED'
            : 'HYBRID';

    await this.prisma.$executeRawUnsafe(
      `
        INSERT INTO recommendation_caches (
          id,
          cache_key,
          model_kind,
          user_id,
          product_id,
          session_id,
          items_json,
          metadata,
          expires_at,
          created_at,
          updated_at
        )
        VALUES (
          UUID(),
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          NOW(),
          NOW()
        )
        ON DUPLICATE KEY UPDATE
          model_kind = VALUES(model_kind),
          user_id = VALUES(user_id),
          product_id = VALUES(product_id),
          session_id = VALUES(session_id),
          items_json = VALUES(items_json),
          metadata = VALUES(metadata),
          expires_at = VALUES(expires_at),
          updated_at = NOW()
      `,
      cacheKey,
      resolvedModelKind,
      userId,
      productId,
      sessionId,
      JSON.stringify(items),
      JSON.stringify({ cacheKey, ttlSeconds }),
      expiresAt,
    );
  }

  private async getFirstRedisItems(
    cacheKeys: string[],
    feed: string,
    limit: number,
  ): Promise<RecommendationItem[]> {
    for (const cacheKey of cacheKeys) {
      const items = await this.getRedisItems(cacheKey, feed, limit);
      if (items.length > 0) {
        return items;
      }
    }

    return [];
  }

  private async getCachedItems(
    cacheKey: string,
    feed: string,
    limit?: number,
  ): Promise<RecommendationItem[]> {
    const redisItems = await this.getRedisItems(cacheKey, feed, limit);
    if (redisItems.length > 0) return redisItems;

    return this.getDbCacheItems(cacheKey, feed, limit);
  }

  private async getRedisItems(
    cacheKey: string,
    feed: string,
    limit?: number,
  ): Promise<RecommendationItem[]> {
    const raw = await redis.get(cacheKey);
    if (!raw) return [];

    cacheHitCounter.inc({ feed });
    try {
      return this.normalizeCachedRecommendationItems(JSON.parse(raw), limit);
    } catch {
      return [];
    }
  }

  private async getDbCacheItems(
    cacheKey: string,
    feed: string,
    limit?: number,
  ): Promise<RecommendationItem[]> {
    const cache = await this.prisma.recommendationCache.findUnique({
      where: { cacheKey },
      select: {
        itemsJson: true,
        expiresAt: true,
      },
    });

    if (!cache || cache.expiresAt <= new Date()) {
      return [];
    }

    const items = this.normalizeCachedRecommendationItems(cache.itemsJson, limit);
    if (items.length === 0) {
      return [];
    }

    const ttlSeconds = Math.max(1, Math.floor((cache.expiresAt.getTime() - Date.now()) / 1000));
    await redis.set(cacheKey, JSON.stringify(items), 'EX', ttlSeconds);
    cacheHitCounter.inc({ feed });
    return items;
  }

  private normalizeCachedRecommendationItems(raw: unknown, limit?: number): RecommendationItem[] {
    const sourceItems = Array.isArray(raw)
      ? raw
      : raw && typeof raw === 'object' && Array.isArray((raw as any).items)
        ? (raw as any).items
        : [];

    const normalized = sourceItems
      .map((item: any, index: number) => {
        const productId = item?.productId ?? item?.id;
        if (typeof productId !== 'string' || !productId.trim()) {
          return null;
        }

        return {
          productId: productId.trim(),
          score: Number.isFinite(Number(item?.score))
            ? Number(item.score)
            : Math.max(0.1, sourceItems.length - index),
          reason:
            typeof item?.reason === 'string' && item.reason.trim()
              ? item.reason.trim()
              : 'Sản phẩm đang được gợi ý',
          source:
            typeof item?.source === 'string' && item.source.trim()
              ? item.source.trim()
              : 'redis_cache',
        };
      })
      .filter(Boolean) as RecommendationItem[];

    return this.uniqueTop(normalized, limit ?? normalized.length);
  }

  private async getLatestProductsFallback(
    limit: number,
    source: string,
  ): Promise<RecommendationItem[]> {
    const products = await this.prisma.product.findMany({
      where: {
        isDeleted: false,
        images: {
          some: {},
        },
      },
      select: { id: true },
      take: limit,
      orderBy: [{ isSale: 'desc' }, { createdAt: 'desc' }],
    });

    return products.map((product, index) => ({
      productId: product.id,
      score: Math.max(0.1, limit - index),
      reason: 'Sản phẩm mới nổi bật',
      source,
    }));
  }

  private async bumpRealtimeSignals(event: RecommendationEventPayload): Promise<void> {
    if (event.productId) {
      const weight =
        event.eventType === 'PURCHASE'
          ? 5
          : event.eventType === 'ADD_TO_CART'
            ? 3
            : event.eventType === 'FAVORITE_PRODUCT'
              ? 2
              : event.eventType === 'RECOMMENDATION_CLICK'
                ? 1.5
                : event.eventType === 'RECOMMENDATION_IMPRESSION'
                  ? 0
                  : 1;
      if (weight > 0) {
        await redis.zincrby('recommendations:hot-products', weight, event.productId);
      }
    }

    if (event.userId && event.productId) {
      await redis.lpush(`recommendations:recent:${event.userId}`, event.productId);
      await redis.ltrim(`recommendations:recent:${event.userId}`, 0, 29);
      await redis.expire(`recommendations:recent:${event.userId}`, 60 * 60 * 24 * 30);
    }
  }

  private async invalidateRealtimeCaches(event: RecommendationEventPayload): Promise<void> {
    const patterns = new Set<string>();

    if (event.sessionId) {
      patterns.add(`recommendations:home:${event.sessionId}:*`);
      patterns.add(`recommendations:home:v2:${event.sessionId}:*`);
      patterns.add(`recommendations:personalized:*:${event.sessionId}:*`);
    }

    if (event.userId) {
      patterns.add(`recommendations:cart:${event.userId}:*`);
      patterns.add(`recommendations:personalized:${event.userId}:*`);
      patterns.add(`recommendations:personalized:v2:${event.userId}:*`);
      patterns.add(`recommendations:personalized:v3:${event.userId}:*`);
      patterns.add(`recommendations:personalized:v4:${event.userId}:*`);
    }

    if (patterns.size === 0) {
      return;
    }

    for (const pattern of patterns) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }
  }

  private async withFeedLatency<T>(feed: string, fn: () => Promise<T>): Promise<T> {
    const startedAt = Date.now();
    try {
      return await fn();
    } finally {
      generationLatency.observe({ feed }, Date.now() - startedAt);
    }
  }

  private async getAiVectorRecommendations(
    contextProductIds: string[],
    limit: number,
    excludedProductIds: string[],
    feed: 'product' | 'cart' | 'personalized',
    userId?: string,
  ): Promise<RecommendationItem[]> {
    if (contextProductIds.length === 0) {
      return [];
    }

    const startedAt = Date.now();
    try {
      const bodyProfile = userId ? await this.getUserBodyProfileContext(userId) : null;
      const response = await fetch(`${AI_SERVICE_URL}/recommend/hybrid`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          user_id: userId ?? null,
          context_product_ids: contextProductIds,
          candidate_product_ids: [],
          user_profile: bodyProfile,
          limit,
        }),
      });

      aiLatency.observe({ operation: `recommend_${feed}` }, Date.now() - startedAt);
      if (!response.ok) {
        throw new Error(`AI service returned status ${response.status}`);
      }

      const payload = await response.json();
      const items = Array.isArray(payload?.items) ? payload.items : [];
      return items
        .filter((item) => item?.product_id && !excludedProductIds.includes(item.product_id))
        .map((item) => ({
          productId: item.product_id,
          score: Number(item.score ?? 0),
          reason: 'Tương đồng embedding từ pgvector',
          source: 'pgvector',
        }));
    } catch (error) {
      aiFallbackCounter.inc({ feed });
      logger.warn('AI vector recommendation fallback triggered', { feed, error });
      return [];
    }
  }

  private async getUserBodyProfileContext(userId: string): Promise<{
    age: number;
    height_cm: number;
    weight_kg: number;
  } | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { age: true, heightCm: true, weightKg: true },
    });

    if (!user?.age || !user.heightCm || !user.weightKg) return null;

    return {
      age: Number(user.age),
      height_cm: Number(user.heightCm),
      weight_kg: Number(user.weightKg),
    };
  }

  private async syncAiArtifacts(): Promise<void> {
    const [products, events] = await Promise.all([
      this.prisma.product.findMany({
        where: { isDeleted: false },
        select: {
          id: true,
          name: true,
          description: true,
          categories: {
            where: { isPrimary: true },
            take: 1,
            select: { category: { select: { name: true } } },
          },
          tags: { select: { tag: { select: { name: true } } } },
        },
        take: 2000,
      }),
      this.prisma.$queryRaw<
        Array<{
          userId: string | null;
          productId: string | null;
          eventType: string;
        }>
      >`
        SELECT
          user_id as userId,
          product_id as productId,
          event_type as eventType
        FROM recommendation_events
        ORDER BY occurred_at DESC
        LIMIT 5000
      `,
    ]);

    const productPayload = products.map((product) => ({
      product_id: product.id,
      title: product.name,
      description: product.description ?? '',
      category: product.categories[0]?.category?.name ?? null,
      attributes: {
        tags: product.tags.map((tag) => tag.tag.name),
      },
    }));
    const eventPayload = events.map((event) => ({
      user_id: event.userId,
      product_id: event.productId,
      event_type: event.eventType,
      weight:
        event.eventType === 'PURCHASE'
          ? 4
          : event.eventType === 'ADD_TO_CART'
            ? 3
            : event.eventType === 'FAVORITE_PRODUCT'
              ? 2
              : 1,
    }));

    await this.postToAi(
      '/train',
      {
        products: productPayload,
        events: eventPayload,
      },
      'train',
    );

    await this.postToAi(
      '/embed/products',
      {
        products: productPayload,
      },
      'embed_products',
    );
  }

  private async postToAi(path: string, payload: unknown, operation: string): Promise<void> {
    const startedAt = Date.now();
    const response = await fetch(`${AI_SERVICE_URL}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    aiLatency.observe({ operation }, Date.now() - startedAt);

    if (!response.ok) {
      throw new Error(`AI service ${path} failed with status ${response.status}`);
    }
  }
}
