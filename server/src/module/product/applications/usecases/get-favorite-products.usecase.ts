import { createLogger } from '../../../../shared/util/logger';
import { GetFavoriteProductsQuery } from '../dto/query/get-favorite-products.query';
import {
  FavoriteProductItemResult,
  FavoriteProductListResult,
} from '../dto/result/favorite-product-list.result';
import { IGetFavoriteProductsUseCase } from '../ports/input/get-favorite-products.usecase';
import {
  FavoriteProductListItem,
  IWishlistRepository,
} from '../ports/output/wishlist.repository';

export class GetFavoriteProductsUseCase implements IGetFavoriteProductsUseCase {
  private readonly logger = createLogger('GetFavoriteProductsUseCase');

  constructor(private readonly wishlistRepository: IWishlistRepository) {}

  async execute(userId: string, query: GetFavoriteProductsQuery): Promise<FavoriteProductListResult> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 && query.limit <= 100 ? query.limit : 10;

    const { items, total } = await this.wishlistRepository.findFavoritesByUser(userId, {
      page,
      limit,
    });

    this.logger.info('Favorite products fetched', {
      userId,
      page,
      limit,
      total,
      resultCount: items.length,
    });

    return {
      products: items.map((item) => this.toResult(item)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private toResult(item: FavoriteProductListItem): FavoriteProductItemResult {
    return {
      productId: item.productId,
      name: item.name,
      slug: item.slug,
      imageUrl: item.imageUrl,
      minPrice: item.minPrice,
      favoritedAt: item.favoritedAt.toISOString(),
    };
  }
}
