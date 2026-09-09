import { describe, expect, it, jest } from '@jest/globals';
import { ExportProductsUseCase } from '../export-products.usecase';
import { IProductRepository } from '../../ports/output';

describe('ExportProductsUseCase', () => {
  it('exports Vietnamese text as an Excel-compatible UTF-8 CSV', async () => {
    const repository = {
      findManyWithFilters: jest.fn(async () => ({
        items: [
          {
            id: 'product-1',
            name: 'Áo Sơ Mi Tay Ngắn',
            basePrice: 3000,
            variantsSummary: { totalStock: 34 },
            categories: [{ name: 'Áo sơ mi tay dài' }],
            tags: [{ name: 'Mới' }],
            status: 'active',
            createdAt: new Date('2026-07-12T15:01:47.444Z'),
          },
        ],
        total: 1,
        aggregations: {},
      })),
    } as unknown as IProductRepository;

    const result = await new ExportProductsUseCase(repository).execute({});

    expect(result.csvContent.charCodeAt(0)).toBe(0xfeff);
    expect(Buffer.from(result.csvContent, 'utf8').subarray(0, 3)).toEqual(
      Buffer.from([0xef, 0xbb, 0xbf]),
    );
    expect(result.csvContent).toContain('Áo Sơ Mi Tay Ngắn');
    expect(result.csvContent).toContain('Áo sơ mi tay dài');
    expect(result.csvContent).toContain('\r\n');
  });
});
