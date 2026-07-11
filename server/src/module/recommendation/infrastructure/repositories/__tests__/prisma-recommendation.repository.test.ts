import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const redisMock = {
  get: jest.fn(),
  set: jest.fn(),
  zrevrange: jest.fn(),
  zincrby: jest.fn(),
  lpush: jest.fn(),
  ltrim: jest.fn(),
  expire: jest.fn(),
  keys: jest.fn(),
  del: jest.fn(),
};

jest.unstable_mockModule('../../../../../infrastructure/database', () => ({
  redis: redisMock,
}));

jest.unstable_mockModule('../../../../../shared/server/prometheus', () => ({
  metricsRegistry: {
    counter: jest.fn(() => ({ inc: jest.fn() })),
    histogram: jest.fn(() => ({ observe: jest.fn() })),
  },
}));

jest.unstable_mockModule('../../../../../shared/util/logger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

const { PrismaRecommendationRepository } = await import('../prisma-recommendation.repository');

function makePrisma(overrides: Record<string, unknown> = {}) {
  return {
    $queryRaw: jest.fn(),
    $queryRawUnsafe: jest.fn(),
    $executeRawUnsafe: jest.fn(),
    recommendationCache: {
      findUnique: jest.fn(),
    },
    productSimilarity: {
      findMany: jest.fn(),
    },
    cart: {
      findUnique: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    productCategory: {
      findMany: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    ...overrides,
  } as any;
}

describe('PrismaRecommendationRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as any).fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        items: [
          { product_id: 'context-1', score: 9 },
          { product_id: 'ai-1', score: 6 },
        ],
      }),
    }));
    redisMock.get.mockResolvedValue(null as never);
    redisMock.set.mockResolvedValue('OK' as never);
    redisMock.zrevrange.mockResolvedValue([] as never);
    redisMock.keys.mockResolvedValue([] as never);
  });

  it('uses hot products before event trending and catalog fallback for home feed', async () => {
    const prisma = makePrisma();
    prisma.recommendationCache.findUnique.mockResolvedValue(null);
    prisma.$queryRawUnsafe.mockResolvedValue([]);
    prisma.$queryRaw
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ productId: 'viewed-1', score: 4, views: 4, purchases: 0 }]);
    redisMock.zrevrange.mockResolvedValue(['hot-1', '10'] as never);

    const repository = new PrismaRecommendationRepository(prisma);
    const items = await repository.getHomeRecommendations(2, 'session-1');

    expect(items.map((item) => item.productId)).toEqual(['hot-1', 'viewed-1']);
    expect(items[0].source).toBe('hot_products');
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });

  it('falls back to DB cache when Redis misses and warms Redis', async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    const prisma = makePrisma();
    prisma.recommendationCache.findUnique.mockResolvedValue({
      expiresAt,
      itemsJson: [
        {
          productId: 'cached-1',
          score: 7,
          reason: 'Cached item',
          source: 'db_cache',
        },
      ],
    });

    const repository = new PrismaRecommendationRepository(prisma);
    const items = await repository.getHomeRecommendations(4, 'session-1');

    expect(items).toEqual([
      {
        productId: 'cached-1',
        score: 7,
        reason: 'Cached item',
        source: 'db_cache',
      },
    ]);
    expect(redisMock.set).toHaveBeenCalledWith(
      'recommendations:home:v2:session-1:4',
      expect.any(String),
      'EX',
      expect.any(Number),
    );
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('excludes context, cart, and recently purchased products from personalized feed', async () => {
    const prisma = makePrisma();
    prisma.recommendationCache.findUnique.mockResolvedValue(null);
    prisma.$queryRaw
      .mockResolvedValueOnce([{ productId: 'context-1', score: 5 }])
      .mockResolvedValueOnce([{ productId: 'purchased-1' }]);
    prisma.$queryRawUnsafe.mockResolvedValue([]);
    prisma.cart.findUnique.mockResolvedValue({
      items: [{ productId: 'cart-1' }],
    });
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.productSimilarity.findMany.mockResolvedValue([
      { relatedProductId: 'related-1', score: 8, algorithm: 'cooccurrence' },
      { relatedProductId: 'context-1', score: 7, algorithm: 'cooccurrence' },
    ]);
    prisma.productCategory.findMany.mockResolvedValue([]);
    prisma.category.findMany.mockResolvedValue([]);
    prisma.product.findMany.mockResolvedValue([{ id: 'fallback-1' }]);

    const repository = new PrismaRecommendationRepository(prisma);
    const items = await repository.getPersonalizedRecommendations('user-1', 'session-1', 3);

    expect(items.map((item) => item.productId)).toEqual(['related-1', 'ai-1', 'fallback-1']);
    expect(items.map((item) => item.productId)).not.toContain('context-1');
    expect(items.map((item) => item.productId)).not.toContain('cart-1');
    expect(items.map((item) => item.productId)).not.toContain('purchased-1');
  });
});
