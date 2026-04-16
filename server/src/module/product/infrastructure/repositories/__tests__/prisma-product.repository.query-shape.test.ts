import { describe, expect, it, jest } from '@jest/globals';
import { PrismaProductRepository } from '../prisma-product.repository';

function makePrismaMock() {
  return {
    product: {
      findMany: jest.fn(async () => []),
      count: jest.fn(async () => 0),
    },
    category: {
      findFirst: jest.fn(async () => null),
      findMany: jest.fn(async () => []),
    },
    variantAttributeValue: {
      groupBy: jest.fn(async () => []),
    },
    attributeOption: {
      findMany: jest.fn(async () => []),
    },
  } as any;
}

describe('PrismaProductRepository.findWithFilters (query-shape)', () => {
  it('does not apply variant constraints when no variant filters are present', async () => {
    const prisma = makePrismaMock();
    const repo = new PrismaProductRepository(prisma);

    await repo.findWithFilters({}, { page: 1, limit: 12 });

    expect(prisma.product.findMany).toHaveBeenCalledTimes(1);
    const args = prisma.product.findMany.mock.calls[0][0];

    expect(args.where).toEqual({ isDeleted: false });
    expect(args.where.variants).toBeUndefined();
  });

  it('builds size filter using attributeValues join with JSON fallback', async () => {
    const prisma = makePrismaMock();
    const repo = new PrismaProductRepository(prisma);

    await repo.findWithFilters({ size: 'L' }, { page: 1, limit: 12 });

    const args = prisma.product.findMany.mock.calls[0][0];
    const where = args.where;

    expect(where).toEqual(
      expect.objectContaining({
        isDeleted: false,
        variants: {
          some: {
            AND: expect.arrayContaining([expect.objectContaining({ isDeleted: false })]),
          },
        },
      }),
    );

    const andClauses: any[] = where.variants.some.AND;
    const sizeClause = andClauses.find(
      (c) => Array.isArray(c?.OR) && c.OR.some((o: any) => o?.attributes?.path === '$.size'),
    );

    expect(sizeClause).toBeTruthy();
    expect(sizeClause.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          attributeValues: {
            some: {
              attribute: { code: 'size' },
              option: { value: 'l' },
              deletedAt: null,
            },
          },
        }),
        expect.objectContaining({
          attributeValues: {
            some: {
              attribute: { code: 'size' },
              option: { label: { equals: 'L', mode: 'insensitive' } },
              deletedAt: null,
            },
          },
        }),
        expect.objectContaining({ attributes: { path: '$.size', equals: 'L' } }),
      ]),
    );
  });

  it('normalizes Vietnamese labels for option.value matches (e.g., "Đỏ" -> "do")', async () => {
    const prisma = makePrismaMock();
    const repo = new PrismaProductRepository(prisma);

    await repo.findWithFilters({ color: 'Đỏ' }, { page: 1, limit: 12 });

    const args = prisma.product.findMany.mock.calls[0][0];
    const andClauses: any[] = args.where.variants.some.AND;
    const colorClause = andClauses.find(
      (c) => Array.isArray(c?.OR) && c.OR.some((o: any) => o?.attributes?.path === '$.color'),
    );

    expect(colorClause).toBeTruthy();
    expect(colorClause.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          attributeValues: {
            some: {
              attribute: { code: 'color' },
              option: { value: 'do' },
              deletedAt: null,
            },
          },
        }),
        expect.objectContaining({ attributes: { path: '$.color', equals: 'Đỏ' } }),
      ]),
    );
  });

  it('merges price constraints with size/color constraints (does not overwrite variants filter)', async () => {
    const prisma = makePrismaMock();
    const repo = new PrismaProductRepository(prisma);

    await repo.findWithFilters(
      { size: 'L', color: 'Đỏ', minPrice: 100, maxPrice: 200 },
      { page: 1, limit: 12 },
    );

    const args = prisma.product.findMany.mock.calls[0][0];
    const andClauses: any[] = args.where.variants.some.AND;

    expect(andClauses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ isDeleted: false }),
        expect.objectContaining({
          price: {
            gte: 100,
            lte: 200,
          },
        }),
      ]),
    );
  });

  it('skips option.value join when normalization yields empty string, but keeps label + JSON fallback', async () => {
    const prisma = makePrismaMock();
    const repo = new PrismaProductRepository(prisma);

    await repo.findWithFilters({ size: '###' }, { page: 1, limit: 12 });

    const args = prisma.product.findMany.mock.calls[0][0];
    const andClauses: any[] = args.where.variants.some.AND;
    const sizeClause = andClauses.find(
      (c) => Array.isArray(c?.OR) && c.OR.some((o: any) => o?.attributes?.path === '$.size'),
    );

    expect(sizeClause).toBeTruthy();
    const orClauses: any[] = sizeClause.OR;

    const hasOptionValuePredicate = orClauses.some(
      (c) => c?.attributeValues?.some?.option?.value !== undefined,
    );

    expect(hasOptionValuePredicate).toBe(false);
    expect(orClauses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          attributeValues: {
            some: {
              attribute: { code: 'size' },
              option: { label: { equals: '###', mode: 'insensitive' } },
              deletedAt: null,
            },
          },
        }),
        expect.objectContaining({ attributes: { path: '$.size', equals: '###' } }),
      ]),
    );
  });

  it('computes aggregations via VariantAttributeValue.groupBy for both size and color', async () => {
    const prisma = makePrismaMock();

    const groupByMock: any = jest.fn();
    groupByMock
      .mockResolvedValueOnce([
        { optionId: 'opt-size-m', _count: { _all: 2 } },
        { optionId: 'opt-size-l', _count: { _all: 1 } },
      ])
      .mockResolvedValueOnce([{ optionId: 'opt-color-do', _count: { _all: 3 } }]);
    (prisma.variantAttributeValue as any).groupBy = groupByMock;

    const findManyMock: any = jest.fn();
    findManyMock
      .mockResolvedValueOnce([
        { id: 'opt-size-m', value: 'm', label: 'M', sortOrder: 1 },
        { id: 'opt-size-l', value: 'l', label: 'L', sortOrder: 2 },
      ])
      .mockResolvedValueOnce([{ id: 'opt-color-do', value: 'do', label: 'Đỏ', sortOrder: 1 }]);
    (prisma.attributeOption as any).findMany = findManyMock;

    const repo = new PrismaProductRepository(prisma);

    const result = await repo.findWithFilters(
      { size: 'L', color: 'Đỏ', minPrice: 100 },
      { page: 1, limit: 12 },
    );

    expect((prisma.variantAttributeValue as any).groupBy).toHaveBeenCalledTimes(2);

    const call0 = (prisma.variantAttributeValue as any).groupBy.mock.calls[0][0];
    const call1 = (prisma.variantAttributeValue as any).groupBy.mock.calls[1][0];

    expect([call0.where.attribute.code, call1.where.attribute.code].sort()).toEqual(
      ['color', 'size'].sort(),
    );

    const findGroupCallByAxis = (axis: 'size' | 'color') =>
      [call0, call1].find((c: any) => c.where.attribute.code === axis);

    const sizeFacetCall: any = findGroupCallByAxis('size');
    const colorFacetCall: any = findGroupCallByAxis('color');

    const hasAxisConstraint = (andClauses: any[], axis: 'size' | 'color') => {
      const clauseMatches = (c: any) => c?.attributeValues?.some?.attribute?.code === axis;
      return andClauses.some((c) => {
        if (clauseMatches(c)) return true;
        if (Array.isArray(c?.OR)) return c.OR.some((o: any) => clauseMatches(o));
        return false;
      });
    };

    // Size facet omits size filter but keeps color filter
    const sizeFacetAnd: any[] = sizeFacetCall.where.variant.AND;
    expect(hasAxisConstraint(sizeFacetAnd, 'size')).toBe(false);
    expect(hasAxisConstraint(sizeFacetAnd, 'color')).toBe(true);

    // Color facet omits color filter but keeps size filter
    const colorFacetAnd: any[] = colorFacetCall.where.variant.AND;
    expect(hasAxisConstraint(colorFacetAnd, 'size')).toBe(true);
    expect(hasAxisConstraint(colorFacetAnd, 'color')).toBe(false);

    expect(result.aggregations).toEqual({
      sizes: [
        { value: 'm', label: 'M', count: 2 },
        { value: 'l', label: 'L', count: 1 },
      ],
      colors: [{ value: 'do', label: 'Đỏ', count: 3 }],
    });
  });
});
