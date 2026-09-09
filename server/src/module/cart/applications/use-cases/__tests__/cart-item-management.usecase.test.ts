import { describe, expect, it, jest } from '@jest/globals';
import { UpdateCartItemUseCase } from '../update-cart-item.usecase';
import { RemoveCartItemUseCase } from '../remove-cart-item.usecase';
import { Cart, CartItem } from '../../../entities/cart.entity';
import { CartItemNotFoundError, InsufficientStockError } from '../../errors';

function makeCart(quantity = 2): Cart {
  return new Cart('cart-1', 'user-1', new Date(), [
    new CartItem(
      'item-1',
      'cart-1',
      'product-1',
      'Product 1',
      'variant-1',
      {
        productName: 'Product 1',
        sku: 'SKU-1',
        attributes: { color: 'Red' },
        price: 50,
        stockAvailable: 20,
      },
      null,
      quantity,
    ),
  ]);
}

describe('Cart item management use cases', () => {
  it('UpdateCartItemUseCase should update quantity when stock is available', async () => {
    const cartRepository = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      findItem: jest.fn(),
      findItemByIdForUser: jest.fn(async () => ({
        id: 'item-1',
        cartId: 'cart-1',
        productId: 'product-1',
        variantId: 'variant-1',
        quantity: 2,
      })),
      addItem: jest.fn(),
      updateItemQuantity: jest.fn(),
      removeItem: jest.fn(),
      getCartDetail: jest.fn(async () => makeCart(3)),
    };

    const variantRepository = {
      findByIdWithProduct: jest.fn(async () => ({
        id: 'variant-1',
        sku: 'SKU-1',
        attributes: {},
        price: 50,
        stockAvailable: 20,
        stockReserved: 5,
        isDeleted: false,
        product: {
          id: 'product-1',
          name: 'Product 1',
          isDeleted: false,
        },
      })),
    };

    const imageRepository = {
      findImageForVariant: jest.fn(async () => null),
    };

    const useCase = new UpdateCartItemUseCase(
      cartRepository as any,
      variantRepository as any,
      imageRepository as any,
    );
    await useCase.execute('user-1', { itemId: 'item-1', quantity: 3 });

    expect(cartRepository.updateItemQuantity).toHaveBeenCalledWith('item-1', 3);
  });

  it('UpdateCartItemUseCase should reject quantity above available stock', async () => {
    const cartRepository = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      findItem: jest.fn(),
      findItemByIdForUser: jest.fn(async () => ({
        id: 'item-1',
        cartId: 'cart-1',
        productId: 'product-1',
        variantId: 'variant-1',
        quantity: 2,
      })),
      addItem: jest.fn(),
      updateItemQuantity: jest.fn(),
      removeItem: jest.fn(),
      getCartDetail: jest.fn(async () => makeCart(2)),
    };

    const variantRepository = {
      findByIdWithProduct: jest.fn(async () => ({
        id: 'variant-1',
        sku: 'SKU-1',
        attributes: {},
        price: 50,
        stockAvailable: 3,
        stockOnHand: 3,
        stockReserved: 0,
        isDeleted: false,
        product: {
          id: 'product-1',
          name: 'Product 1',
          isDeleted: false,
        },
      })),
    };

    const imageRepository = {
      findImageForVariant: jest.fn(async () => null),
    };

    const useCase = new UpdateCartItemUseCase(
      cartRepository as any,
      variantRepository as any,
      imageRepository as any,
    );

    await expect(
      useCase.execute('user-1', { itemId: 'item-1', quantity: 4 }),
    ).rejects.toBeInstanceOf(InsufficientStockError);

    expect(cartRepository.updateItemQuantity).not.toHaveBeenCalled();
  });

  it('RemoveCartItemUseCase should remove cart item', async () => {
    const cartRepository = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      findItem: jest.fn(),
      findItemByIdForUser: jest.fn(async () => ({
        id: 'item-1',
        cartId: 'cart-1',
        productId: 'product-1',
        variantId: 'variant-1',
        quantity: 2,
      })),
      addItem: jest.fn(),
      updateItemQuantity: jest.fn(),
      removeItem: jest.fn(),
      getCartDetail: jest.fn(async () => new Cart('cart-1', 'user-1', new Date(), [])),
    };

    const imageRepository = {
      findImageForVariant: jest.fn(),
    };

    const useCase = new RemoveCartItemUseCase(cartRepository as any, imageRepository as any);
    await useCase.execute('user-1', 'item-1');

    expect(cartRepository.removeItem).toHaveBeenCalledWith('item-1');
  });

  it('UpdateCartItemUseCase should not update an item owned by another user', async () => {
    const cartRepository = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      findItem: jest.fn(),
      findItemByIdForUser: jest.fn(async (_itemId: string, _userId: string) => null),
      addItem: jest.fn(),
      updateItemQuantity: jest.fn(),
      removeItem: jest.fn(),
      getCartDetail: jest.fn(),
    };

    const variantRepository = {
      findByIdWithProduct: jest.fn(),
    };

    const imageRepository = {
      findImageForVariant: jest.fn(),
    };

    const useCase = new UpdateCartItemUseCase(
      cartRepository as any,
      variantRepository as any,
      imageRepository as any,
    );

    await expect(
      useCase.execute('user-2', { itemId: 'item-owned-by-user-1', quantity: 2 }),
    ).rejects.toBeInstanceOf(CartItemNotFoundError);

    expect(cartRepository.findItemByIdForUser).toHaveBeenCalledWith(
      'item-owned-by-user-1',
      'user-2',
    );
    expect(cartRepository.updateItemQuantity).not.toHaveBeenCalled();
  });
});
