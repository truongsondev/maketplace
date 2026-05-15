import { describe, expect, it, jest } from '@jest/globals';
import { AddToCartUseCase } from '../add-to-cart.usecase';
import { Cart } from '../../../entities/cart.entity';
import { InsufficientStockError } from '../../errors';

describe('AddToCartUseCase', () => {
  it('should reject when resulting cart quantity exceeds available stock', async () => {
    const cartRepository = {
      findByUserId: jest.fn(async () => new Cart('cart-1', 'user-1', new Date(), [])),
      create: jest.fn(),
      findItem: jest.fn(async () => ({
        id: 'item-1',
        quantity: 2,
      })),
      findItemByIdForUser: jest.fn(),
      addItem: jest.fn(),
      updateItemQuantity: jest.fn(),
      removeItem: jest.fn(),
      getCartDetail: jest.fn(),
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
      findImageForVariant: jest.fn(),
    };

    const useCase = new AddToCartUseCase(
      cartRepository as any,
      variantRepository as any,
      imageRepository as any,
    );

    await expect(
      useCase.execute('user-1', { variantId: 'variant-1', quantity: 2 }),
    ).rejects.toBeInstanceOf(InsufficientStockError);

    expect(cartRepository.updateItemQuantity).not.toHaveBeenCalled();
    expect(cartRepository.addItem).not.toHaveBeenCalled();
  });
});
