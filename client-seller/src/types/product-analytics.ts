export type AdminProductTopSellingItem = {
  productId: string;
  name: string;
  imageUrl: string | null;
  quantitySold: number;
  ordersCount: number;
};

export type AdminProductTopFavoritedItem = {
  productId: string;
  name: string;
  imageUrl: string | null;
  favoritesCount: number;
};

export type AdminProductLeastBoughtItem = {
  productId: string;
  name: string;
  imageUrl: string | null;
  quantitySold: number;
};

export type AdminProductTopSelling = {
  from: string;
  to: string;
  days: number;
  limit: number;
  items: AdminProductTopSellingItem[];
  updatedAt: string;
};

export type AdminProductTopFavorited = {
  from: string;
  to: string;
  days: number;
  limit: number;
  items: AdminProductTopFavoritedItem[];
  updatedAt: string;
};

export type AdminProductLeastBought = {
  from: string;
  to: string;
  days: number;
  limit: number;
  items: AdminProductLeastBoughtItem[];
  updatedAt: string;
};

export type AdminProductTopSellingResponse = {
  success: boolean;
  data: AdminProductTopSelling;
  message: string;
  timestamp: string;
};

export type AdminProductTopFavoritedResponse = {
  success: boolean;
  data: AdminProductTopFavorited;
  message: string;
  timestamp: string;
};

export type AdminProductLeastBoughtResponse = {
  success: boolean;
  data: AdminProductLeastBought;
  message: string;
  timestamp: string;
};
