import { UpdateVariantCommand, UpdateVariantResult } from '../dto';
import { IUpdateVariantUseCase } from '../ports/input';
import { IVariantRepository, IPriceHistoryRepository } from '../ports/output';
import { ProductNotFoundError } from '../errors';
import { createLogger } from '@/shared/util/logger';

export class UpdateVariantUseCase implements IUpdateVariantUseCase {
  private readonly logger = createLogger('UpdateVariantUseCase');

  constructor(
    private readonly variantRepository: IVariantRepository,
    private readonly priceHistoryRepository: IPriceHistoryRepository,
  ) {}

  async execute(command: UpdateVariantCommand): Promise<UpdateVariantResult> {
    this.logger.info('Updating variant', { variantId: command.variantId });

    // Check if variant exists
    const existingVariant = await this.variantRepository.findById(command.variantId);
    if (!existingVariant) {
      throw new ProductNotFoundError(command.variantId);
    }

    let priceChanged = false;

    // Check for price change
    if (command.price !== undefined && command.price !== existingVariant.price) {
      priceChanged = true;
      await this.priceHistoryRepository.create({
        productId: existingVariant.productId!,
        variantId: command.variantId,
        oldPrice: existingVariant.price,
        newPrice: command.price,
      });
    }

    // Update variant
    await this.variantRepository.update(command.variantId, command);

    this.logger.info('Variant updated successfully', { variantId: command.variantId });

    return {
      success: true,
      message: 'Variant updated successfully',
      priceChanged,
    };
  }
}
