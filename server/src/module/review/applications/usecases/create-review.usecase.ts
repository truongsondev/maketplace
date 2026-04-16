import { createLogger } from '@/shared/util/logger';
import { BadRequestError } from '@/error-handlling/badRequestError';
import type { CreateReviewCommand, CreateReviewResult, ReviewImageInput } from '../dto/review.dto';
import type { ICreateReviewUseCase } from '../ports/input/create-review.usecase';
import type { IOrderItemRepository } from '../ports/output/order-item.repository';
import type { IReviewRepository } from '../ports/output/review.repository';

export class CreateReviewUseCase implements ICreateReviewUseCase {
  private readonly logger = createLogger('CreateReviewUseCase');

  constructor(
    private readonly orderItemRepository: IOrderItemRepository,
    private readonly reviewRepository: IReviewRepository,
  ) {}

  async execute(command: CreateReviewCommand): Promise<CreateReviewResult> {
    const rating = Number(command.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BadRequestError('rating must be an integer between 1 and 5');
    }

    const commentRaw = typeof command.comment === 'string' ? command.comment.trim() : '';
    const comment = commentRaw ? commentRaw.slice(0, 2000) : null;

    const images: ReviewImageInput[] = Array.isArray(command.images) ? command.images : [];
    const normalizedImages = images
      .filter(
        (img: ReviewImageInput) =>
          Boolean(img) && typeof img.url === 'string' && img.url.trim().length > 0,
      )
      .slice(0, 6)
      .map((img: ReviewImageInput) => ({
        url: img.url.trim(),
        publicId:
          typeof img.publicId === 'string' && img.publicId.trim().length > 0
            ? img.publicId.trim()
            : null,
      }));

    const orderItem = await this.orderItemRepository.findByIdWithOrder(command.orderItemId);
    if (!orderItem) {
      throw new BadRequestError('Order item not found');
    }

    if (orderItem.order.userId !== command.userId) {
      throw new BadRequestError('Order item does not belong to user');
    }

    if (orderItem.order.status !== 'DELIVERED') {
      throw new BadRequestError('Only delivered orders can be reviewed');
    }

    const existing = await this.reviewRepository.findByUserAndOrderItem(
      command.userId,
      command.orderItemId,
    );

    if (existing) {
      return {
        reviewId: existing.id,
        message: 'Review already exists',
        alreadyExists: true,
      };
    }

    this.logger.info('Creating review', {
      userId: command.userId,
      orderId: orderItem.orderId,
      orderItemId: command.orderItemId,
      productId: orderItem.productId,
      imagesCount: normalizedImages.length,
    });

    const created = await this.reviewRepository.createReview({
      userId: command.userId,
      productId: orderItem.productId,
      orderItemId: command.orderItemId,
      rating,
      comment,
      images: normalizedImages,
    });

    return {
      reviewId: created.id,
      message: 'Review created successfully',
      alreadyExists: false,
    };
  }
}
