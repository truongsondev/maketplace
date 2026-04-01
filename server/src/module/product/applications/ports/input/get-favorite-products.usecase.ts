import { GetFavoriteProductsQuery } from '../../dto/query/get-favorite-products.query';
import { FavoriteProductListResult } from '../../dto/result/favorite-product-list.result';

export interface IGetFavoriteProductsUseCase {
  execute(userId: string, query: GetFavoriteProductsQuery): Promise<FavoriteProductListResult>;
}
