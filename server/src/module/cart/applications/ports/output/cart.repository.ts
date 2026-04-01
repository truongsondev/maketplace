import { Cart } from '../../../entities/cart.entity';

export interface ICartRepository {
  findByUserId(userId: string): Promise<Cart | null>;
  create(userId: string): Promise<Cart>;
  findItem(cartId: string, productId: string, variantId: string): Promise<CartItemData | null>;
  findItemByIdForUser(itemId: string, userId: string): Promise<CartItemByUserData | null>;
  addItem(data: AddCartItemData): Promise<void>;
  updateItemQuantity(itemId: string, quantity: number): Promise<void>;
  removeItem(itemId: string): Promise<void>;
  getCartDetail(userId: string): Promise<Cart | null>;
}

export interface CartItemData {
  id: string;
  quantity: number;
}

export interface AddCartItemData {
  cartId: string;
  productId: string;
  variantId: string;
  quantity: number;
}

export interface CartItemByUserData {
  id: string;
  cartId: string;
  productId: string;
  variantId: string;
  quantity: number;
}
