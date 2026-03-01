import { SaveProductImageCommand, SaveProductImageResult } from '../dto';
import { ISaveProductImageUseCase } from '../ports/input/save-product-image.usecase';
import { IProductImageRepository } from '../ports/output/product-image.repository';
import { IProductRepository } from '../ports/output/product.repository';
import { ProductNotFoundError } from '../errors';
import { createLogger } from '@/shared/util/logger';

export class SaveProductImageUseCase implements ISaveProductImageUseCase {
  private readonly logger = createLogger('SaveProductImageUseCase');

  constructor(
    private readonly productImageRepository: IProductImageRepository,
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(command: SaveProductImageCommand): Promise<SaveProductImageResult> {
    this.logger.info('Saving product image metadata', {
      productId: command.productId,
      publicId: command.publicId,
    });

    const product = await this.productRepository.findById(command.productId);
    if (!product) {
      this.logger.warn('Product not found', { productId: command.productId });
      throw new ProductNotFoundError(command.productId);
    }

    if (command.isPrimary) {
      const existingImages = await this.productImageRepository.findByProductId(command.productId);
      const primaryImage = existingImages.find((img) => img.isPrimary);
      if (primaryImage) {
        await this.productImageRepository.updatePrimaryStatus(command.productId, primaryImage.id);
      }
    }

    const savedImage = await this.productImageRepository.save({
      productId: command.productId,
      variantId: command.variantId,
      url: command.url,
      altText: command.altText,
      sortOrder: command.sortOrder ?? 0,
      isPrimary: command.isPrimary ?? false,
    });

    this.logger.info('Product image saved successfully', {
      imageId: savedImage.id,
      productId: command.productId,
    });

    return {
      imageId: savedImage.id,
      message: 'Product image saved successfully',
    };
  }
}
