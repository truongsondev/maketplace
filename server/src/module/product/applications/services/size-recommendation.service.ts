import type { PrismaClient } from '@/generated/prisma/client';
import { BadRequestError } from '../../../../error-handlling/badRequestError';

export class SizeRecommendationService {
  constructor(private readonly prisma: PrismaClient) {}

  async recommend(input: {
    productId: string;
    heightCm: number;
    weightKg: number;
    fitPreference?: 'SLIM' | 'REGULAR' | 'RELAXED';
  }) {
    if (!Number.isFinite(input.heightCm) || input.heightCm < 100 || input.heightCm > 230) {
      throw new BadRequestError('heightCm must be between 100 and 230');
    }
    if (!Number.isFinite(input.weightKg) || input.weightKg < 30 || input.weightKg > 250) {
      throw new BadRequestError('weightKg must be between 30 and 250');
    }
    const product = await this.prisma.product.findFirst({
      where: { id: input.productId, isDeleted: false },
      select: { productTypeId: true },
    });
    if (!product) throw new BadRequestError('Product not found');

    const rules = await this.prisma.sizeChartRule.findMany({
      where: {
        isActive: true,
        OR: [
          { productId: input.productId },
          { productId: null, productTypeId: product.productTypeId },
        ],
      },
      orderBy: [{ productId: 'desc' }, { priority: 'desc' }],
    });
    const matches = rules.filter((rule) => {
      const heightOk =
        (rule.minHeightCm === null || input.heightCm >= Number(rule.minHeightCm)) &&
        (rule.maxHeightCm === null || input.heightCm <= Number(rule.maxHeightCm));
      const weightOk =
        (rule.minWeightKg === null || input.weightKg >= Number(rule.minWeightKg)) &&
        (rule.maxWeightKg === null || input.weightKg <= Number(rule.maxWeightKg));
      return heightOk && weightOk && (!input.fitPreference || rule.fitPreference === input.fitPreference);
    });
    if (matches.length === 0) {
      return {
        recommendedSize: null,
        confidence: 'LOW',
        alternatives: [],
        reason: 'Chưa có quy tắc size phù hợp với số đo này.',
      };
    }
    return {
      recommendedSize: matches[0].sizeLabel,
      confidence: matches.length === 1 ? 'HIGH' : 'MEDIUM',
      alternatives: matches.slice(1, 3).map((rule) => rule.sizeLabel),
      reason:
        matches.length === 1
          ? 'Đề xuất dựa trên chiều cao, cân nặng và kiểu mặc mong muốn.'
          : 'Số đo nằm gần ranh giới nhiều size; bạn nên xem thêm bảng size.',
    };
  }
}
