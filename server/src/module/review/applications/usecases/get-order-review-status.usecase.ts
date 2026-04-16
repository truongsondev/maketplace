import { BadRequestError } from '@/error-handlling/badRequestError';
import { createLogger } from '@/shared/util/logger';
import type { GetOrderReviewStatusQuery, GetOrderReviewStatusResult } from '../dto/review.dto';
import type { IGetOrderReviewStatusUseCase } from '../ports/input/get-order-review-status.usecase';
import type { IOrderItemRepository } from '../ports/output/order-item.repository';
import type { IReviewRepository } from '../ports/output/review.repository';

export class GetOrderReviewStatusUseCase implements IGetOrderReviewStatusUseCase {
  private readonly logger = createLogger('GetOrderReviewStatusUseCase');

  constructor(
    private readonly orderItemRepository: IOrderItemRepository,
    private readonly reviewRepository: IReviewRepository,
  ) {}

  async execute(query: GetOrderReviewStatusQuery): Promise<GetOrderReviewStatusResult> {
    const order = await this.orderItemRepository.findOrderWithItemsForUser(
      query.orderId,
      query.userId,
    );
    if (!order) {
      throw new BadRequestError('Order not found');
    }

    const orderItemIds = order.items.map((it) => it.id);
    if (orderItemIds.length === 0) {
      return { orderId: order.id, items: [] };
    }

    const reviews = await this.reviewRepository.findByUserAndOrderItemIds(
      query.userId,
      orderItemIds,
    );
    const byOrderItemId = new Map<string, string>();
    for (const r of reviews) {
      if (r.orderItemId) {
        byOrderItemId.set(r.orderItemId, r.id);
      }
    }

    this.logger.info('Order review status computed', {
      orderId: order.id,
      userId: query.userId,
      items: orderItemIds.length,
      reviewed: byOrderItemId.size,
    });

    return {
      orderId: order.id,
      items: orderItemIds.map((orderItemId) => ({
        orderItemId,
        reviewed: byOrderItemId.has(orderItemId),
        reviewId: byOrderItemId.get(orderItemId) ?? null,
      })),
    };
  }
}
