import type { PrismaClient } from '@/generated/prisma/client';
import type { ReviewImageInput } from '../../applications/dto/review.dto';
import type {
  ExistingReviewLookup,
  IReviewRepository,
  ReviewStatusRow,
} from '../../applications/ports/output/review.repository';

export class PrismaReviewRepository implements IReviewRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUserAndOrderItem(
    userId: string,
    orderItemId: string,
  ): Promise<ExistingReviewLookup | null> {
    return this.prisma.review.findFirst({
      where: { userId, orderItemId },
      select: { id: true },
    });
  }

  async createReview(input: {
    userId: string;
    productId: string;
    orderItemId: string;
    rating: number;
    comment: string | null;
    images: ReviewImageInput[];
  }): Promise<{ id: string }> {
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          userId: input.userId,
          productId: input.productId,
          orderItemId: input.orderItemId,
          rating: input.rating,
          comment: input.comment,
        },
        select: { id: true },
      });

      if (input.images.length > 0) {
        await tx.reviewImage.createMany({
          data: input.images.map((img, idx) => ({
            reviewId: created.id,
            url: img.url,
            publicId: img.publicId ?? null,
            sortOrder: idx,
          })),
        });
      }

      return created;
    });
  }

  async findByUserAndOrderItemIds(
    userId: string,
    orderItemIds: string[],
  ): Promise<ReviewStatusRow[]> {
    if (orderItemIds.length === 0) return [];

    return this.prisma.review.findMany({
      where: {
        userId,
        orderItemId: { in: orderItemIds },
      },
      select: {
        id: true,
        orderItemId: true,
      },
    });
  }
}
