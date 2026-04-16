import type { AdminProductTopFavorited } from '../dto/admin-product-analytics.dto';
import type {
  AdminProductAnalyticsCommand,
  IAdminProductAnalyticsRepository,
} from '../ports/output/admin-product-analytics.repository';

export class GetAdminProductTopFavoritedUseCase {
  constructor(private readonly repo: IAdminProductAnalyticsRepository) {}

  execute(command: AdminProductAnalyticsCommand): Promise<AdminProductTopFavorited> {
    return this.repo.getTopFavorited(command);
  }
}
