import { createLogger } from '../../../../shared/util/logger';
import { GetCategoryShowcasesQuery } from '../dto/query/get-category-showcases.query';
import { CategoryShowcaseResult } from '../dto/result/category-showcase.result';
import { IGetCategoryShowcasesUseCase } from '../ports/input/get-category-showcases.usecase';
import { IProductRepository } from '../ports/output/product.repository';

export class GetCategoryShowcasesUseCase implements IGetCategoryShowcasesUseCase {
  private readonly logger = createLogger('GetCategoryShowcasesUseCase');

  constructor(private readonly productRepository: IProductRepository) {}

  async execute(query: GetCategoryShowcasesQuery): Promise<CategoryShowcaseResult[]> {
    const categoryLimit =
      query.categoryLimit && query.categoryLimit > 0 && query.categoryLimit <= 10
        ? query.categoryLimit
        : 4;
    const productLimit =
      query.productLimit && query.productLimit > 0 && query.productLimit <= 20
        ? query.productLimit
        : 3;

    const showcases = await this.productRepository.findCategoryShowcases(categoryLimit, productLimit);

    this.logger.info('Category showcases fetched', {
      categoryLimit,
      productLimit,
      categories: showcases.length,
    });

    return showcases;
  }
}
