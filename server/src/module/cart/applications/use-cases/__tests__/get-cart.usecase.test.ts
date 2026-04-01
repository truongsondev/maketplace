import { describe, expect, it, jest } from '@jest/globals';
import { GetCartUseCase } from '../get-cart.usecase';
import { Cart, CartItem } from '../../../entities/cart.entity';

describe('GetCartUseCase', () => {
  it('should create an empty cart when user has no cart', async () => {
    const createMock = jest.fn(
      async (_userId: string) => new Cart('cart-1', 'user-1', new Date(), []),
    );

    const cartRepository = {
      findByUserId: jest.fn(),
      create: createMock,
      findItem: jest.fn(),
      findItemByIdForUser: jest.fn(),
      addItem: jest.fn(),
      updateItemQuantity: jest.fn(),
      removeItem: jest.fn(),
      getCartDetail: jest.fn(async () => null),
    };

    const imageRepository = {
      findImageForVariant: jest.fn(),
    };

    const useCase = new GetCartUseCase(cartRepository as any, imageRepository as any);

    const result = await useCase.execute('user-1');

    expect(result.cartId).toBe('cart-1');
    expect(result.totalItems).toBe(0);
    expect(result.items).toEqual([]);
    expect(createMock).toHaveBeenCalledWith('user-1');
  });

  it('should return cart items with image enrichment', async () => {
    const cart = new Cart('cart-1', 'user-1', new Date(), [
      new CartItem(
        'item-1',
        'cart-1',
        'product-1',
        'Product 1',
        'variant-1',
        {
          productName: 'Product 1',
          sku: 'SKU-1',
          attributes: { size: 'M' },
          price: 100,
          stockAvailable: 10,
        },
        null,
        2,
      ),
    ]);

    const cartRepository = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      findItem: jest.fn(),
      findItemByIdForUser: jest.fn(),
      addItem: jest.fn(),
      updateItemQuantity: jest.fn(),
      removeItem: jest.fn(),
      getCartDetail: jest.fn(async () => cart),
    };

    const imageRepository = {
      findImageForVariant: jest.fn(async () => ({
        url: 'https://cdn.example.com/p1.jpg',
        altText: null,
        isPrimary: true,
      })),
    };

    const useCase = new GetCartUseCase(cartRepository as any, imageRepository as any);
    const result = await useCase.execute('user-1');

    expect(result.totalQuantity).toBe(2);
    expect(result.totalAmount).toBe(200);
    expect(result.items[0].image?.url).toBe('https://cdn.example.com/p1.jpg');
    expect(result.items[0].image?.altText).toBe('Product 1');
  });
});
