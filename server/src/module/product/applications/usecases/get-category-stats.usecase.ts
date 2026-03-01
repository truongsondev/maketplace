import { GetCategoryStatsQuery } from '../dto/query/get-category-stats.query';
import { CategoryStatsResult } from '../dto/result/category-stats.result';
import { IGetCategoryStatsUseCase } from '../ports/input/get-category-stats.usecase';
import { ICategoryRepository } from '../ports/output/category.repository';
import { Category } from '../../entities/category/category.entity';

export class GetCategoryStatsUseCase implements IGetCategoryStatsUseCase {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute(query: GetCategoryStatsQuery): Promise<CategoryStatsResult[]> {
    const categories = await this.categoryRepository.findAllWithProductCount();

    const filtered = query.nonEmptyOnly ? categories.filter((c) => c.hasProducts()) : categories;

    return filtered.map((c) => this.toResult(c));
  }

  private toResult(category: Category): CategoryStatsResult {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      imageUrl: category.imageUrl,
      productCount: category.productCount,
    };
  }
}
