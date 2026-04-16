import type {
  AdminProductLeastBought,
  AdminProductTopFavorited,
  AdminProductTopSelling,
} from '../../applications/dto/admin-product-analytics.dto';
import type { AdminProductAnalyticsCommand } from '../../applications/ports/output/admin-product-analytics.repository';
import { GetAdminProductLeastBoughtUseCase } from '../../applications/usecases/get-admin-product-least-bought.usecase';
import { GetAdminProductTopFavoritedUseCase } from '../../applications/usecases/get-admin-product-top-favorited.usecase';
import { GetAdminProductTopSellingUseCase } from '../../applications/usecases/get-admin-product-top-selling.usecase';

export class AdminProductAnalyticsController {
  constructor(
    private readonly topSellingUseCase: GetAdminProductTopSellingUseCase,
    private readonly topFavoritedUseCase: GetAdminProductTopFavoritedUseCase,
    private readonly leastBoughtUseCase: GetAdminProductLeastBoughtUseCase,
  ) {}

  getTopSelling(command: AdminProductAnalyticsCommand): Promise<AdminProductTopSelling> {
    return this.topSellingUseCase.execute(command);
  }

  getTopFavorited(command: AdminProductAnalyticsCommand): Promise<AdminProductTopFavorited> {
    return this.topFavoritedUseCase.execute(command);
  }

  getLeastBought(command: AdminProductAnalyticsCommand): Promise<AdminProductLeastBought> {
    return this.leastBoughtUseCase.execute(command);
  }
}
