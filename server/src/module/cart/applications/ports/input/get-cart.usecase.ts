import { CartDetailResult } from '../../dto';

export interface IGetCartUseCase {
  execute(userId: string): Promise<CartDetailResult>;
}
