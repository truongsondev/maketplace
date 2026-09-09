import { GetCategoryStatsQuery } from '../dto/query/get-category-stats.query';
import { CategoryStatsResult } from '../dto/result/category-stats.result';
import { IGetCategoryStatsUseCase } from '../ports/input/get-category-stats.usecase';
import { ICategoryRepository } from '../ports/output/category.repository';
import { Category } from '../../entities/category/category.entity';
import { createLogger } from '@/shared/util/logger';

export class GetCategoryStatsUseCase implements IGetCategoryStatsUseCase {
  private readonly logger = createLogger('GetCategoryStatsUseCase');

  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute(query: GetCategoryStatsQuery): Promise<CategoryStatsResult[]> {
    this.logger.debug('Fetching category statistics', { query });

    const categories = await this.categoryRepository.findAllWithProductCount();

    const filtered = query.nonEmptyOnly ? categories.filter((c) => c.hasProducts()) : categories;

    this.logger.info('Category statistics fetched', {
      totalCategories: categories.length,
      filteredCount: filtered.length,
      nonEmptyOnly: query.nonEmptyOnly,
    });

    return filtered.map((c) => this.toResult(c));
  }

  private toResult(category: Category): CategoryStatsResult {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      imageUrl: category.imageUrl,
      parentId: category.parentId,
      productCount: category.productCount,
    };
  }
}
