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

    return rows.map((row) =>
      Category.fromPersistence({
        id: row.id,
        name: row.name,
        slug: row.slug,
        imageUrl: row.imageUrl,
        productCount: row._count.products,
      }),
    );
  }
}
