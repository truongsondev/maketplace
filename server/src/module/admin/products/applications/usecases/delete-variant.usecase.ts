import { DeleteVariantCommand, DeleteVariantResult } from '../dto';
import { IDeleteVariantUseCase } from '../ports/input';
import { IVariantRepository } from '../ports/output';
import { ProductNotFoundError, InvalidProductDataError } from '../errors';
import { createLogger } from '@/shared/util/logger';

export class DeleteVariantUseCase implements IDeleteVariantUseCase {
  private readonly logger = createLogger('DeleteVariantUseCase');

  constructor(private readonly variantRepository: IVariantRepository) {}

  async execute(command: DeleteVariantCommand): Promise<DeleteVariantResult> {
    this.logger.info('Deleting variant (soft delete)', { variantId: command.variantId });

    // Check if variant exists
    const variant = await this.variantRepository.findById(command.variantId);
    if (!variant) {
      throw new ProductNotFoundError(command.variantId);
    }

    // Check if this is the last active variant for the product
    const activeVariantCount = await this.variantRepository.countActiveByProductId(
      variant.productId!,
    );
    if (activeVariantCount <= 1) {
      throw new InvalidProductDataError(
        'Cannot delete the last active variant. Product must have at least one variant.',
      );
    }

    // Soft delete
    await this.variantRepository.softDelete(command.variantId);

    this.logger.info('Variant deleted successfully', { variantId: command.variantId });

    return {
      success: true,
      message: 'Variant deleted successfully',
    };
  }
}
