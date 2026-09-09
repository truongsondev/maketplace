import type { AdminProductLeastBought } from '../dto/admin-product-analytics.dto';
import type {
  AdminProductAnalyticsCommand,
  IAdminProductAnalyticsRepository,
} from '../ports/output/admin-product-analytics.repository';

export class GetAdminProductLeastBoughtUseCase {
  constructor(private readonly repo: IAdminProductAnalyticsRepository) {}

  execute(command: AdminProductAnalyticsCommand): Promise<AdminProductLeastBought> {
    return this.repo.getLeastBought(command);
  }
}
