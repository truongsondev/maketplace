import { PrismaClient } from '@/generated/prisma/client';
import { ICategoryRepository } from '../../applications/ports/output/category.repository';
import { Category } from '../../entities/category/category.entity';

export class PrismaCategoryRepository implements ICategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAllWithProductCount(): Promise<Category[]> {
    const rows = await this.prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        parentId: true,
        sortOrder: true,
        _count: {
          select: {
            products: {
              where: {
                product: { isDeleted: false },
              },
            },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    const directCountsById = new Map<string, number>();
    const childrenByParentId = new Map<string, string[]>();
    const byId = new Map(
      rows.map((row) => [
        row.id,
        {
          id: row.id,
          name: row.name,
          slug: row.slug,
          imageUrl: row.imageUrl,
          parentId: row.parentId,
          sortOrder: row.sortOrder,
        },
      ]),
    );

    rows.forEach((row) => {
      directCountsById.set(row.id, row._count.products);
      if (row.parentId) {
        const list = childrenByParentId.get(row.parentId) ?? [];
        list.push(row.id);
        childrenByParentId.set(row.parentId, list);
      }
    });

    const aggregatedCountsById = new Map<string, number>();
    const visitState = new Map<string, 0 | 1 | 2>();

    const dfsAggregateCount = (id: string): number => {
      const state = visitState.get(id) ?? 0;
      if (state === 2) return aggregatedCountsById.get(id) ?? 0;
      if (state === 1) {
        // Cycle detected (should never happen). Fall back to direct count.
        return directCountsById.get(id) ?? 0;
      }

      visitState.set(id, 1);

      const directCount = directCountsById.get(id) ?? 0;
      let sum = directCount;

      const children = childrenByParentId.get(id) ?? [];
      for (const childId of children) {
        sum += dfsAggregateCount(childId);
      }

      visitState.set(id, 2);
      aggregatedCountsById.set(id, sum);
      return sum;
    };

    // Ensure all nodes are aggregated
    for (const id of byId.keys()) {
      dfsAggregateCount(id);
    }

    return rows
      .map((row) =>
        Category.fromPersistence({
          id: row.id,
          name: row.name,
          slug: row.slug,
          imageUrl: row.imageUrl,
          parentId: row.parentId,
          productCount: aggregatedCountsById.get(row.id) ?? row._count.products,
        }),
      )
      .sort((a, b) => {
        const aRow = byId.get(a.id);
        const bRow = byId.get(b.id);
        return (aRow?.sortOrder ?? 0) - (bRow?.sortOrder ?? 0);
      });
  }
}
