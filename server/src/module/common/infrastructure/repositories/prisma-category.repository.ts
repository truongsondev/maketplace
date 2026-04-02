import { PrismaClient } from '../../../../../generated/prisma/client';
import { ICategoryRepository } from '../../applications/ports/output';
import { CategoryDto } from '../../applications/dto';

export class PrismaCategoryRepository implements ICategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<CategoryDto[]> {
    const categories = await this.prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return categories.map((category) => this.mapToDto(category));
  }

  async findById(id: string): Promise<CategoryDto | null> {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    return category ? this.mapToDto(category) : null;
  }

  async count(): Promise<number> {
    return this.prisma.category.count();
  }

  private mapToDto(category: any): CategoryDto {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}
