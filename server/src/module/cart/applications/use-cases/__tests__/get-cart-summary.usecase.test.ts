import { describe, expect, it, jest } from '@jest/globals';
import { GetCartSummaryUseCase } from '../get-cart-summary.usecase';

describe('GetCartSummaryUseCase', () => {
  it('should return cart summary from repository', async () => {
    const cartRepository = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      findItem: jest.fn(),
      findItemByIdForUser: jest.fn(),
      addItem: jest.fn(),
      updateItemQuantity: jest.fn(),
      removeItem: jest.fn(),
      getCartDetail: jest.fn(),
      getCartSummary: jest.fn(async () => ({
        totalItems: 3,
        totalPrice: 750000,
      })),
    };

    const useCase = new GetCartSummaryUseCase(cartRepository as any);
    const result = await useCase.execute('user-1');

    expect(cartRepository.getCartSummary).toHaveBeenCalledWith('user-1');
    expect(result).toEqual({
      totalItems: 3,
      totalPrice: 750000,
    });
  });
});
