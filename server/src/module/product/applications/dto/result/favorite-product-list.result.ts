export interface FavoriteProductItemResult {
  productId: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  minPrice: number;
  favoritedAt: string;
}

export interface FavoriteProductListResult {
  products: FavoriteProductItemResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
