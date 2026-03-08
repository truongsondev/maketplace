import { GetCategoryStatsQuery } from '../../applications/dto/query/get-category-stats.query';
import { CategoryStatsResult } from '../../applications/dto/result/category-stats.result';
import { IGetCategoryStatsUseCase } from '../../applications/ports/input/get-category-stats.usecase';
import { GetProductsQuery } from '../../applications/dto/query/get-products.query';
import { ProductListResult } from '../../applications/dto/result/product-list.result';
import { IGetProductsUseCase } from '../../applications/ports/input/get-products.usecase';
import { GetProductDetailQuery } from '../../applications/dto/query/get-product-detail.query';
import { ProductDetailResult } from '../../applications/dto/result/product-detail.result';
import { IGetProductDetailUseCase } from '../../applications/ports/input/get-product-detail.usecase';

export class ProductController {
  constructor(
    private readonly getCategoryStatsUseCase: IGetCategoryStatsUseCase,
    private readonly getProductsUseCase: IGetProductsUseCase,
    private readonly getProductDetailUseCase: IGetProductDetailUseCase,
  ) {}

  async getCategoryStats(query: GetCategoryStatsQuery): Promise<CategoryStatsResult[]> {
    return this.getCategoryStatsUseCase.execute(query);
  }

  async getProducts(query: GetProductsQuery): Promise<ProductListResult> {
    return this.getProductsUseCase.execute(query);
  }

  async getProductDetail(query: GetProductDetailQuery): Promise<ProductDetailResult> {
    return this.getProductDetailUseCase.execute(query);
  }
}
