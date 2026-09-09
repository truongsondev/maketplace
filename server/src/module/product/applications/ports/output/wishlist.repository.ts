export interface FavoriteProductSummary {
  id: string;
  name: string;
}

export interface FavoriteProductListItem {
  productId: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  minPrice: number;
  favoritedAt: Date;
}

export interface UpsertFavoriteResult {
  wishlistId: string;
  created: boolean;
  createdAt: Date;
}

export interface IWishlistRepository {
  findActiveProductById(productId: string): Promise<FavoriteProductSummary | null>;
  upsertFavorite(userId: string, productId: string): Promise<UpsertFavoriteResult>;
  removeFavorite(userId: string, productId: string): Promise<boolean>;
  findFavoritesByUser(
    userId: string,
    pagination: { page: number; limit: number },
  ): Promise<{ items: FavoriteProductListItem[]; total: number }>;
}
