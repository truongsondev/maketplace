import type {
  AdminProductLeastBought,
  AdminProductTopFavorited,
  AdminProductTopSelling,
} from '../../dto/admin-product-analytics.dto';

export type AdminProductAnalyticsCommand = {
  days: number;
  limit: number;
};

export interface IAdminProductAnalyticsRepository {
  getTopSelling(command: AdminProductAnalyticsCommand): Promise<AdminProductTopSelling>;
  getTopFavorited(command: AdminProductAnalyticsCommand): Promise<AdminProductTopFavorited>;
  getLeastBought(command: AdminProductAnalyticsCommand): Promise<AdminProductLeastBought>;
}
