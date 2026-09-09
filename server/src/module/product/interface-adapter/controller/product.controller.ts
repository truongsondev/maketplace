import { GetCategoryStatsQuery } from '../../applications/dto/query/get-category-stats.query';
import { GetCategoryShowcasesQuery } from '../../applications/dto/query/get-category-showcases.query';
import { CategoryShowcaseResult } from '../../applications/dto/result/category-showcase.result';
import { CategoryStatsResult } from '../../applications/dto/result/category-stats.result';
import { IGetCategoryStatsUseCase } from '../../applications/ports/input/get-category-stats.usecase';
import { IGetCategoryShowcasesUseCase } from '../../applications/ports/input/get-category-showcases.usecase';
import { GetProductsQuery } from '../../applications/dto/query/get-products.query';
import { ProductListResult } from '../../applications/dto/result/product-list.result';
import { IGetProductsUseCase } from '../../applications/ports/input/get-products.usecase';
import { GetProductDetailQuery } from '../../applications/dto/query/get-product-detail.query';
import { ProductDetailResult } from '../../applications/dto/result/product-detail.result';
import { IGetProductDetailUseCase } from '../../applications/ports/input/get-product-detail.usecase';
import { AddProductFavoriteResult } from '../../applications/dto/result/add-product-favorite.result';
import { IAddProductFavoriteUseCase } from '../../applications/ports/input/add-product-favorite.usecase';
import { RemoveProductFavoriteResult } from '../../applications/dto/result/remove-product-favorite.result';
import { IRemoveProductFavoriteUseCase } from '../../applications/ports/input/remove-product-favorite.usecase';
import { GetFavoriteProductsQuery } from '../../applications/dto/query/get-favorite-products.query';
import { FavoriteProductListResult } from '../../applications/dto/result/favorite-product-list.result';
import { IGetFavoriteProductsUseCase } from '../../applications/ports/input/get-favorite-products.usecase';
import { IGetRelatedProductsFromOrdersUseCase } from '../../applications/ports/input/get-related-products-from-orders.usecase';
import { RelatedProductsFromOrdersResult } from '../../applications/dto/result/related-products-from-orders.result';
import { IGetHomeTeamContentUseCase } from '../../applications/ports/input/get-home-team-content.usecase';
import { HomeTeamContentResult } from '../../applications/dto/result/home-team-content.result';

export class ProductController {
  constructor(
    private readonly getCategoryStatsUseCase: IGetCategoryStatsUseCase,
    private readonly getCategoryShowcasesUseCase: IGetCategoryShowcasesUseCase,
    private readonly getProductsUseCase: IGetProductsUseCase,
    private readonly getProductDetailUseCase: IGetProductDetailUseCase,
    private readonly addProductFavoriteUseCase: IAddProductFavoriteUseCase,
    private readonly removeProductFavoriteUseCase: IRemoveProductFavoriteUseCase,
    private readonly getFavoriteProductsUseCase: IGetFavoriteProductsUseCase,
    private readonly getRelatedProductsFromOrdersUseCase: IGetRelatedProductsFromOrdersUseCase,
    private readonly getHomeTeamContentUseCase: IGetHomeTeamContentUseCase,
  ) {}

  async getCategoryStats(query: GetCategoryStatsQuery): Promise<CategoryStatsResult[]> {
    return this.getCategoryStatsUseCase.execute(query);
  }

  async getCategoryShowcases(query: GetCategoryShowcasesQuery): Promise<CategoryShowcaseResult[]> {
    return this.getCategoryShowcasesUseCase.execute(query);
  }

  async getProducts(query: GetProductsQuery): Promise<ProductListResult> {
    return this.getProductsUseCase.execute(query);
  }

  async getProductDetail(query: GetProductDetailQuery): Promise<ProductDetailResult> {
    return this.getProductDetailUseCase.execute(query);
  }

  async addProductToFavorite(userId: string, productId: string): Promise<AddProductFavoriteResult> {
    return this.addProductFavoriteUseCase.execute(userId, productId);
  }

  async removeProductFromFavorite(
    userId: string,
    productId: string,
  ): Promise<RemoveProductFavoriteResult> {
    return this.removeProductFavoriteUseCase.execute(userId, productId);
  }

  async getFavoriteProducts(
    userId: string,
    query: GetFavoriteProductsQuery,
  ): Promise<FavoriteProductListResult> {
    return this.getFavoriteProductsUseCase.execute(userId, query);
  }

  async getRelatedProductsFromMyOrders(
    userId: string,
    limit?: number,
  ): Promise<RelatedProductsFromOrdersResult> {
    return this.getRelatedProductsFromOrdersUseCase.execute(userId, { limit });
  }

  async getHomeTeamContent(): Promise<HomeTeamContentResult> {
    return this.getHomeTeamContentUseCase.execute();
  }
}
