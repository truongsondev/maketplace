import { PrismaClient } from '../../../../../../generated/prisma/client';
import { ITagRepository } from '../../applications/ports/output';

export class PrismaTagRepository implements ITagRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(command: any): Promise<any[]> {
    const where: any = {};

    if (command.search) {
      where.name = {
        contains: command.search,
        mode: 'insensitive',
      };
    }

    return await this.prisma.tag.findMany({
      where,
      take: command.limit || 20,
      orderBy: { name: 'asc' },
    });
  }

  async findByIds(ids: string[]): Promise<any[]> {
    return await this.prisma.tag.findMany({
      where: { id: { in: ids } },
    });
  }

  async existsByIds(ids: string[]): Promise<boolean> {
    const count = await this.prisma.tag.count({
      where: { id: { in: ids } },
    });
    return count === ids.length;
  }
}
