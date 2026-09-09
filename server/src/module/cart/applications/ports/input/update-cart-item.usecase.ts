import { CartDetailResult, UpdateCartItemCommand } from '../../dto';

export interface IUpdateCartItemUseCase {
  execute(userId: string, command: UpdateCartItemCommand): Promise<CartDetailResult>;
}
