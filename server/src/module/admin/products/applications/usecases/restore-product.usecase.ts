import { RestoreProductCommand, RestoreProductResult } from '../dto';
import { IRestoreProductUseCase } from '../ports/input';
import { IProductRepository } from '../ports/output';
import { ProductNotFoundError } from '../errors';
import { createLogger } from '@/shared/util/logger';

export class RestoreProductUseCase implements IRestoreProductUseCase {
  private readonly logger = createLogger('RestoreProductUseCase');

  constructor(private readonly productRepository: IProductRepository) {}

  async execute(command: RestoreProductCommand): Promise<RestoreProductResult> {
    this.logger.info('Restoring product', { productId: command.productId });

    // Check if product exists
    const product = await this.productRepository.findById(command.productId);
    if (!product) {
      throw new ProductNotFoundError(command.productId);
    }

    // Restore
    await this.productRepository.restore(command.productId);

    this.logger.info('Product restored successfully', { productId: command.productId });

    return {
      success: true,
      message: 'Product restored successfully',
      productId: command.productId,
    };
  }
}
