import { PrismaClient } from '../../../../../generated/prisma/client';
import { ICategoryRepository } from '../../applications/ports/output';
import { CategoryDto } from '../../applications/dto';

export class PrismaCategoryRepository implements ICategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(params?: { parentId?: string; includeChildren?: boolean }): Promise<CategoryDto[]> {
    const { parentId, includeChildren = false } = params || {};

    const where = parentId !== undefined ? { parentId } : {};

    const categories = await this.prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: includeChildren
        ? {
            children: {
              orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
            },
          }
        : undefined,
    });

    return categories.map((category) => this.mapToDto(category));
  }

  async findById(id: string): Promise<CategoryDto | null> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: {
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });

    return category ? this.mapToDto(category) : null;
  }

  async count(params?: { parentId?: string }): Promise<number> {
    const { parentId } = params || {};

    const where = parentId !== undefined ? { parentId } : {};

    return this.prisma.category.count({
      where,
    });
  }

  private mapToDto(category: any): CategoryDto {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
      parentId: category.parentId,
      sortOrder: category.sortOrder,
      children: category.children?.map((child: any) => this.mapToDto(child)),
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}
