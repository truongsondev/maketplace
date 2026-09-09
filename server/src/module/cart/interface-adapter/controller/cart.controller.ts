import {
  IAddToCartUseCase,
  IGetCartUseCase,
  IGetCartSummaryUseCase,
  IUpdateCartItemUseCase,
  IRemoveCartItemUseCase,
} from '../../applications/ports/input';
import {
  AddToCartCommand,
  CartDetailResult,
  CartSummaryResult,
  UpdateCartItemCommand,
} from '../../applications/dto';

export class CartController {
  constructor(
    private readonly addToCartUseCase: IAddToCartUseCase,
    private readonly getCartUseCase: IGetCartUseCase,
    private readonly getCartSummaryUseCase: IGetCartSummaryUseCase,
    private readonly updateCartItemUseCase: IUpdateCartItemUseCase,
    private readonly removeCartItemUseCase: IRemoveCartItemUseCase,
  ) {}

  async addToCart(userId: string, command: AddToCartCommand): Promise<CartDetailResult> {
    return this.addToCartUseCase.execute(userId, command);
  }

  async getCart(userId: string): Promise<CartDetailResult> {
    return this.getCartUseCase.execute(userId);
  }

  async getCartSummary(userId: string): Promise<CartSummaryResult> {
    return this.getCartSummaryUseCase.execute(userId);
  }

  async updateCartItem(userId: string, command: UpdateCartItemCommand): Promise<CartDetailResult> {
    return this.updateCartItemUseCase.execute(userId, command);
  }

  async removeCartItem(userId: string, itemId: string): Promise<CartDetailResult> {
    return this.removeCartItemUseCase.execute(userId, itemId);
  }
}
