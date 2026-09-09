import { AdjustStockCommand, AdjustStockResult } from '../dto';
import { IAdjustStockUseCase } from '../ports/input';
import { IVariantRepository } from '../ports/output';
import { ProductNotFoundError } from '../errors';
import { createLogger } from '@/shared/util/logger';

export class AdjustStockUseCase implements IAdjustStockUseCase {
  private readonly logger = createLogger('AdjustStockUseCase');

  constructor(private readonly variantRepository: IVariantRepository) {}

  async execute(command: AdjustStockCommand): Promise<AdjustStockResult> {
    this.logger.info('Adjusting stock', {
      variantId: command.variantId,
      action: command.action,
      quantity: command.quantity,
    });

    // Check if variant exists
    const variant = await this.variantRepository.findById(command.variantId);
    if (!variant) {
      throw new ProductNotFoundError(command.variantId);
    }

    // Adjust stock and create inventory log
    const result = await this.variantRepository.adjustStock(
      command.variantId,
      command.action,
      command.quantity,
      command.referenceId,
    );

    this.logger.info('Stock adjusted successfully', {
      variantId: command.variantId,
      oldStock: result.oldStock,
      newStock: result.newStock,
    });

    return {
      success: true,
      message: 'Stock adjusted successfully',
      data: {
        variantId: command.variantId,
        oldStock: result.oldStock,
        newStock: result.newStock,
        logId: result.logId,
      },
    };
  }
}
