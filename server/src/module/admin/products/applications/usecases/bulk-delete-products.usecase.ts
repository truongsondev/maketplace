import { BulkDeleteProductsCommand, BulkDeleteProductsResult } from '../dto';
import { IBulkDeleteProductsUseCase } from '../ports/input';
import { IProductRepository } from '../ports/output';
import { createLogger } from '@/shared/util/logger';

export class BulkDeleteProductsUseCase implements IBulkDeleteProductsUseCase {
  private readonly logger = createLogger('BulkDeleteProductsUseCase');

  constructor(private readonly productRepository: IProductRepository) {}

  async execute(command: BulkDeleteProductsCommand): Promise<BulkDeleteProductsResult> {
    this.logger.info('Bulk deleting products', { count: command.productIds.length });

    const result = await this.productRepository.bulkSoftDelete(command.productIds);

    this.logger.info('Bulk delete completed', {
      successCount: result.successCount,
      failedCount: result.failedIds.length,
    });

    return {
      success: true,
      message: `${result.successCount} products deleted successfully`,
      successCount: result.successCount,
      failedCount: result.failedIds.length,
      failedIds: result.failedIds,
    };
  }
}
