import { describe, expect, it, jest } from '@jest/globals';
import { GetCategoryShowcasesUseCase } from '../get-category-showcases.usecase';
import { IProductRepository } from '../../ports/output/product.repository';

describe('GetCategoryShowcasesUseCase', () => {
  it('should return showcases with default limits', async () => {
    const repository: IProductRepository = {
      findWithFilters: jest.fn(async () => ({ products: [], total: 0 })),
      findByIdWithDetails: jest.fn(async () => null),
      findCategoryShowcases: jest.fn(async () => [
        {
          id: 'cat-1',
          name: 'Ao Khoac',
          slug: 'ao-khoac',
          imageUrl: 'https://example.com/cat.jpg',
          products: [
            {
              id: 'p-1',
              name: 'Jacket A',
              imageUrl: 'https://example.com/jacket.jpg',
              minPrice: 500000,
              isNew: true,
              isSale: false,
            },
          ],
        },
      ]),
    };

    const useCase = new GetCategoryShowcasesUseCase(repository);
    const result = await useCase.execute({});

    expect(repository.findCategoryShowcases).toHaveBeenCalledWith(4, 3);
    expect(result).toHaveLength(1);
    expect(result[0].products[0].isNew).toBe(true);
  });

  it('should clamp invalid limits to defaults', async () => {
    const repository: IProductRepository = {
      findWithFilters: jest.fn(async () => ({ products: [], total: 0 })),
      findByIdWithDetails: jest.fn(async () => null),
      findCategoryShowcases: jest.fn(async () => []),
    };

    const useCase = new GetCategoryShowcasesUseCase(repository);
    await useCase.execute({ categoryLimit: 0, productLimit: 1000 });

    expect(repository.findCategoryShowcases).toHaveBeenCalledWith(4, 3);
  });
});
