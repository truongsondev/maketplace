import { CartDetailResult } from '../../dto';

export interface IRemoveCartItemUseCase {
  execute(userId: string, itemId: string): Promise<CartDetailResult>;
}
