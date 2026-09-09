import { describe, expect, it, jest } from '@jest/globals';
import { BadRequestError } from '@/error-handlling/badRequestError';
import { CreateReviewUseCase } from '../create-review.usecase';
import type { IOrderItemRepository } from '../../ports/output/order-item.repository';
import type { IReviewRepository } from '../../ports/output/review.repository';

describe('CreateReviewUseCase ownership', () => {
  it('rejects an order item that belongs to another user', async () => {
    const orderItemRepository: IOrderItemRepository = {
      findByIdWithOrder: jest.fn(async () => ({
        id: 'order-item-1',
        productId: 'product-1',
        variantId: 'variant-1',
        orderId: 'order-1',
        order: {
          id: 'order-1',
          userId: 'user-1',
          status: 'DELIVERED' as const,
        },
      })),
      findOrderWithItemsForUser: jest.fn(async () => null),
    };

    const reviewRepository: IReviewRepository = {
      findByUserAndOrderItem: jest.fn(async () => null),
      createReview: jest.fn(async () => ({ id: 'review-1' })),
      findByUserAndOrderItemIds: jest.fn(async () => []),
    };

    const useCase = new CreateReviewUseCase(orderItemRepository, reviewRepository);

    await expect(
      useCase.execute({
        userId: 'user-2',
        orderItemId: 'order-item-1',
        rating: 5,
        comment: 'Great',
        images: [],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);

    expect(reviewRepository.createReview).not.toHaveBeenCalled();
  });
});
