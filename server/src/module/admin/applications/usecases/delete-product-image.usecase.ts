import { DeleteProductImageCommand, DeleteProductImageResult } from '../dto';
import { IDeleteProductImageUseCase } from '../ports/input/delete-product-image.usecase';
import { IProductImageRepository } from '../ports/output/product-image.repository';
import { ICloudinaryService } from '../ports/output/cloudinary.service';
import { ImageNotFoundError } from '../errors';
import { createLogger } from '@/shared/util/logger';

export class DeleteProductImageUseCase implements IDeleteProductImageUseCase {
  private readonly logger = createLogger('DeleteProductImageUseCase');

  constructor(
    private readonly productImageRepository: IProductImageRepository,
    private readonly cloudinaryService: ICloudinaryService,
  ) {}

  async execute(command: DeleteProductImageCommand): Promise<DeleteProductImageResult> {
    this.logger.info('Deleting product image', {
      imageId: command.imageId,
      publicId: command.publicId,
    });

    const image = await this.productImageRepository.findById(command.imageId);
    if (!image) {
      this.logger.warn('Image not found', { imageId: command.imageId });
      throw new ImageNotFoundError(command.imageId);
    }

    await this.cloudinaryService.deleteImage(command.publicId);
    this.logger.info('Image deleted from Cloudinary', { publicId: command.publicId });

    await this.productImageRepository.delete(command.imageId);
    this.logger.info('Image record deleted from database', { imageId: command.imageId });

    return {
      success: true,
      message: 'Product image deleted successfully',
    };
  }
}
