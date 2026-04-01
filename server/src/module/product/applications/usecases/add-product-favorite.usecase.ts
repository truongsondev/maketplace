import { NotFoundError } from '../../../../error-handlling/notFoundError';
import { createLogger } from '../../../../shared/util/logger';
import { AddProductFavoriteResult } from '../dto/result/add-product-favorite.result';
import { IAddProductFavoriteUseCase } from '../ports/input/add-product-favorite.usecase';
import { IWishlistRepository } from '../ports/output/wishlist.repository';

export class AddProductFavoriteUseCase implements IAddProductFavoriteUseCase {
  private readonly logger = createLogger('AddProductFavoriteUseCase');

  constructor(private readonly wishlistRepository: IWishlistRepository) {}

  async execute(userId: string, productId: string): Promise<AddProductFavoriteResult> {
    const product = await this.wishlistRepository.findActiveProductById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const upsertResult = await this.wishlistRepository.upsertFavorite(userId, productId);

    this.logger.info('Product added to favorites', {
      userId,
      productId,
      wishlistId: upsertResult.wishlistId,
      created: upsertResult.created,
    });

    return {
      productId,
      isFavorite: true,
      created: upsertResult.created,
      favoritedAt: upsertResult.createdAt.toISOString(),
    };
  }
}
