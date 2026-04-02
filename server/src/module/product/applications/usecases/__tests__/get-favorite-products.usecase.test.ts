import { describe, expect, it, jest } from '@jest/globals';
import { GetFavoriteProductsUseCase } from '../get-favorite-products.usecase';
import { IWishlistRepository } from '../../ports/output/wishlist.repository';

describe('GetFavoriteProductsUseCase', () => {
  it('should return favorite products with requested pagination', async () => {
    const repository: IWishlistRepository = {
      findActiveProductById: jest.fn(async () => null),
      upsertFavorite: jest.fn(async () => ({
        wishlistId: 'w1',
        created: true,
        createdAt: new Date(),
      })),
      removeFavorite: jest.fn(async () => true),
      findFavoritesByUser: jest.fn(async () => ({
        items: [
          {
            productId: 'p1',
            name: 'Sneaker Alpha',
            slug: 'sneaker-alpha',
            imageUrl: 'https://example.com/p1.jpg',
            minPrice: 199000,
            favoritedAt: new Date('2026-04-01T10:00:00.000Z'),
          },
        ],
        total: 21,
      })),
    };

    const useCase = new GetFavoriteProductsUseCase(repository);

    const result = await useCase.execute('user-1', { page: 2, limit: 10 });

    expect(repository.findFavoritesByUser).toHaveBeenCalledWith('user-1', {
      page: 2,
      limit: 10,
    });
    expect(result.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 21,
      totalPages: 3,
    });
    expect(result.products).toEqual([
      {
        productId: 'p1',
        name: 'Sneaker Alpha',
        slug: 'sneaker-alpha',
        imageUrl: 'https://example.com/p1.jpg',
        minPrice: 199000,
        favoritedAt: '2026-04-01T10:00:00.000Z',
      },
    ]);
  });

  it('should fallback to default pagination when query is invalid', async () => {
    const repository: IWishlistRepository = {
      findActiveProductById: jest.fn(async () => null),
      upsertFavorite: jest.fn(async () => ({
        wishlistId: 'w1',
        created: true,
        createdAt: new Date(),
      })),
      removeFavorite: jest.fn(async () => true),
      findFavoritesByUser: jest.fn(async () => ({
        items: [],
        total: 0,
      })),
    };

    const useCase = new GetFavoriteProductsUseCase(repository);

    await useCase.execute('user-2', { page: 0, limit: 999 });

    expect(repository.findFavoritesByUser).toHaveBeenCalledWith('user-2', {
      page: 1,
      limit: 10,
    });
  });
});
