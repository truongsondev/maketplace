import { AddProductFavoriteResult } from '../../dto/result/add-product-favorite.result';

export interface IAddProductFavoriteUseCase {
  execute(userId: string, productId: string): Promise<AddProductFavoriteResult>;
}
