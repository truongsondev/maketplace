import type { GetOrderReviewStatusQuery, GetOrderReviewStatusResult } from '../../dto';

export interface IGetOrderReviewStatusUseCase {
  execute(query: GetOrderReviewStatusQuery): Promise<GetOrderReviewStatusResult>;
}
