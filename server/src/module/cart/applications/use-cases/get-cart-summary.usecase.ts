import { CartSummaryResult } from '../dto';
import { IGetCartSummaryUseCase } from '../ports/input';
import { ICartRepository } from '../ports/output';

export class GetCartSummaryUseCase implements IGetCartSummaryUseCase {
  constructor(private readonly cartRepository: ICartRepository) {}

  async execute(userId: string): Promise<CartSummaryResult> {
    return this.cartRepository.getCartSummary(userId);
  }
}
