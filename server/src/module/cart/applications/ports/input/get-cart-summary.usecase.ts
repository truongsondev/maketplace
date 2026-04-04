import { CartSummaryResult } from '../../dto';

export interface IGetCartSummaryUseCase {
  execute(userId: string): Promise<CartSummaryResult>;
}
