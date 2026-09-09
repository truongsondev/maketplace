import { PrismaClient } from '../../../../../../generated/prisma/client';
import { ICategoryRepository } from '../../applications/ports/output';

export class PrismaCategoryRepository implements ICategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<any[]> {
    return await this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findByIds(ids: string[]): Promise<any[]> {
    return await this.prisma.category.findMany({
      where: { id: { in: ids } },
    });
  }

  async existsByIds(ids: string[]): Promise<boolean> {
    const count = await this.prisma.category.count({
      where: { id: { in: ids } },
    });
    return count === ids.length;
  }
}
