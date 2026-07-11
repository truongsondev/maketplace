import { describe, expect, it, jest } from '@jest/globals';
import type { PrismaClient } from '@/generated/prisma/client';
import { SizeRecommendationService } from '../size-recommendation.service';

describe('SizeRecommendationService', () => {
  it('reports a boundary case instead of claiming a certain fit', async () => {
    const prisma = {
      product: { findFirst: jest.fn(async () => ({ productTypeId: 'shirt' })) },
      sizeChartRule: {
        findMany: jest.fn(async () => [
          { sizeLabel: 'M', minHeightCm: 165, maxHeightCm: 175, minWeightKg: 55, maxWeightKg: 65, fitPreference: 'REGULAR' },
          { sizeLabel: 'L', minHeightCm: 170, maxHeightCm: 180, minWeightKg: 60, maxWeightKg: 75, fitPreference: 'REGULAR' },
        ]),
      },
    } as unknown as PrismaClient;
    const result = await new SizeRecommendationService(prisma).recommend({
      productId: 'product-1', heightCm: 172, weightKg: 62, fitPreference: 'REGULAR',
    });
    expect(result.recommendedSize).toBe('M');
    expect(result.confidence).toBe('MEDIUM');
    expect(result.alternatives).toContain('L');
  });
});
