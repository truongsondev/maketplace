import { DeleteProductCommand, DeleteProductResult } from '../dto';
import { IDeleteProductUseCase } from '../ports/input';
import { IProductRepository } from '../ports/output';
import { ProductNotFoundError } from '../errors';
import { createLogger } from '@/shared/util/logger';

export class DeleteProductUseCase implements IDeleteProductUseCase {
  private readonly logger = createLogger('DeleteProductUseCase');

  constructor(private readonly productRepository: IProductRepository) {}

  async execute(command: DeleteProductCommand): Promise<DeleteProductResult> {
    this.logger.info('Deleting product (soft delete)', { productId: command.productId });

    // Check if product exists
    const product = await this.productRepository.findById(command.productId);
    if (!product) {
      throw new ProductNotFoundError(command.productId);
    }

    // Soft delete
    await this.productRepository.softDelete(command.productId);

    this.logger.info('Product deleted successfully', { productId: command.productId });

    return {
      success: true,
      message: 'Product deleted successfully',
    };
  }
}
