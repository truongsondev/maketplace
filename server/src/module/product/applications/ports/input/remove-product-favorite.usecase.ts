import { RemoveProductFavoriteResult } from '../../dto/result/remove-product-favorite.result';

export interface IRemoveProductFavoriteUseCase {
  execute(userId: string, productId: string): Promise<RemoveProductFavoriteResult>;
}
