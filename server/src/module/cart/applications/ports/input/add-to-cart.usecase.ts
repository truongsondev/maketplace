import { AddToCartCommand, CartDetailResult } from '../../dto';

export interface IAddToCartUseCase {
  execute(userId: string, command: AddToCartCommand): Promise<CartDetailResult>;
}
