import type { AdminProductTopSelling } from '../dto/admin-product-analytics.dto';
import type {
  AdminProductAnalyticsCommand,
  IAdminProductAnalyticsRepository,
} from '../ports/output/admin-product-analytics.repository';

export class GetAdminProductTopSellingUseCase {
  constructor(private readonly repo: IAdminProductAnalyticsRepository) {}

  execute(command: AdminProductAnalyticsCommand): Promise<AdminProductTopSelling> {
    return this.repo.getTopSelling(command);
  }
}
