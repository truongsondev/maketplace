import { PrismaClient } from '../../../../../generated/prisma/client';
import { ITagRepository } from '../../applications/ports/output';
import { TagDto } from '../../applications/dto';

export class PrismaTagRepository implements ITagRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(params?: { search?: string; limit?: number; offset?: number }): Promise<TagDto[]> {
    const { search, limit = 50, offset = 0 } = params || {};

    const where = search
      ? {
          name: {
            contains: search,
          },
        }
      : {};

    const tags = await this.prisma.tag.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
      take: limit,
      skip: offset,
    });

    return tags.map((tag) => this.mapToDto(tag));
  }

  async findById(id: string): Promise<TagDto | null> {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });

    return tag ? this.mapToDto(tag) : null;
  }

  async count(params?: { search?: string }): Promise<number> {
    const { search } = params || {};

    const where = search
      ? {
          name: {
            contains: search,
          },
        }
      : {};

    return this.prisma.tag.count({
      where,
    });
  }

  private mapToDto(tag: any): TagDto {
    return {
      id: tag.id,
      name: tag.name,
      description: tag.description,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    };
  }
}
