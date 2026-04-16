import type { ReviewImageInput } from '../../dto';

export type ExistingReviewLookup = {
  id: string;
};

export type ReviewStatusRow = {
  id: string;
  orderItemId: string | null;
};

export interface IReviewRepository {
  findByUserAndOrderItem(userId: string, orderItemId: string): Promise<ExistingReviewLookup | null>;

  createReview(input: {
    userId: string;
    productId: string;
    orderItemId: string;
    rating: number;
    comment: string | null;
    images: ReviewImageInput[];
  }): Promise<{ id: string }>;

  findByUserAndOrderItemIds(userId: string, orderItemIds: string[]): Promise<ReviewStatusRow[]>;
}
