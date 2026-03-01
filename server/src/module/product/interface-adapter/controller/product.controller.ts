import { GetCategoryStatsQuery } from '../../applications/dto/query/get-category-stats.query';
import { CategoryStatsResult } from '../../applications/dto/result/category-stats.result';
import { IGetCategoryStatsUseCase } from '../../applications/ports/input/get-category-stats.usecase';
import { GetProductsQuery } from '../../applications/dto/query/get-products.query';
import { ProductListResult } from '../../applications/dto/result/product-list.result';
import { IGetProductsUseCase } from '../../applications/ports/input/get-products.usecase';

export class ProductController {
  constructor(
    private readonly getCategoryStatsUseCase: IGetCategoryStatsUseCase,
    private readonly getProductsUseCase: IGetProductsUseCase,
  ) {}

  async getCategoryStats(query: GetCategoryStatsQuery): Promise<CategoryStatsResult[]> {
    return this.getCategoryStatsUseCase.execute(query);
  }

  async getProducts(query: GetProductsQuery): Promise<ProductListResult> {
    return this.getProductsUseCase.execute(query);
  }
}
