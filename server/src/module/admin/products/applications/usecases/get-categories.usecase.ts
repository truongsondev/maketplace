import { GetCategoriesCommand, GetCategoriesResult } from '../dto';
import { IGetCategoriesUseCase } from '../ports/input';
import { ICategoryRepository } from '../ports/output';
import { createLogger } from '@/shared/util/logger';

export class GetCategoriesUseCase implements IGetCategoriesUseCase {
  private readonly logger = createLogger('GetCategoriesUseCase');

  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute(command: GetCategoriesCommand): Promise<GetCategoriesResult> {
    this.logger.info('Getting categories tree');

    const categories = await this.categoryRepository.findAll();

    const sortedCategories = categories
      .map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        parentId: cat.parentId ?? null,
        sortOrder: cat.sortOrder,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

    return {
      categories: sortedCategories,
    };
  }
}
