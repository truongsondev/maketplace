import { GetCategoriesQuery, GetCategoriesResult } from '../dto';
import { IGetCategoriesUseCase } from '../ports/input';
import { ICategoryRepository } from '../ports/output';
import { createLogger } from '@/shared/util/logger';

export class GetCategoriesUseCase implements IGetCategoriesUseCase {
  private readonly logger = createLogger('GetCategoriesUseCase');

  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute(query: GetCategoriesQuery): Promise<GetCategoriesResult> {
    this.logger.info('Getting categories', query);

    const [categories, total] = await Promise.all([
      this.categoryRepository.findAll(),
      this.categoryRepository.count(),
    ]);

    this.logger.info('Categories retrieved', {
      count: categories.length,
      total,
    });

    return {
      categories,
      total,
    };
  }
}
