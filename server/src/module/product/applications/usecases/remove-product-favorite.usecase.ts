import { NotFoundError } from '../../../../error-handlling/notFoundError';
import { createLogger } from '../../../../shared/util/logger';
import { RemoveProductFavoriteResult } from '../dto/result/remove-product-favorite.result';
import { IRemoveProductFavoriteUseCase } from '../ports/input/remove-product-favorite.usecase';
import { IWishlistRepository } from '../ports/output/wishlist.repository';

export class RemoveProductFavoriteUseCase implements IRemoveProductFavoriteUseCase {
  private readonly logger = createLogger('RemoveProductFavoriteUseCase');

  constructor(private readonly wishlistRepository: IWishlistRepository) {}

  async execute(userId: string, productId: string): Promise<RemoveProductFavoriteResult> {
    const product = await this.wishlistRepository.findActiveProductById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const removed = await this.wishlistRepository.removeFavorite(userId, productId);

    this.logger.info('Product removed from favorites', {
      userId,
      productId,
      removed,
    });

    return {
      productId,
      isFavorite: false,
      removed,
    };
  }
}
