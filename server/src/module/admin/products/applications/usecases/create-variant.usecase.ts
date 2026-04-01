import { CreateVariantCommand, CreateVariantResult } from '../dto';
import { ICreateVariantUseCase } from '../ports/input';
import { IVariantRepository, IProductRepository } from '../ports/output';
import {
  ProductNotFoundError,
  ProductAlreadyExistsError,
  InvalidProductDataError,
} from '../errors';
import { ProductVariant } from '../../entities/product/product.entity';
import { createLogger } from '@/shared/util/logger';

export class CreateVariantUseCase implements ICreateVariantUseCase {
  private readonly logger = createLogger('CreateVariantUseCase');

  constructor(
    private readonly variantRepository: IVariantRepository,
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(command: CreateVariantCommand): Promise<CreateVariantResult> {
    this.logger.info('Creating variant', { productId: command.productId, sku: command.sku });

    // Check if product exists
    const product = await this.productRepository.findById(command.productId);
    if (!product) {
      throw new ProductNotFoundError(command.productId);
    }

    // Check for duplicate SKU
    const skuExists = await this.variantRepository.existsBySku(command.sku);
    if (skuExists) {
      throw new ProductAlreadyExistsError(command.sku);
    }

    // Validate data
    if (command.price < 0) {
      throw new InvalidProductDataError('Price must be non-negative');
    }
    if (command.stockAvailable < 0) {
      throw new InvalidProductDataError('Stock must be non-negative');
    }

    // Create variant entity
    const variant = ProductVariant.create({
      sku: command.sku,
      attributes: command.attributes,
      price: command.price,
      stockAvailable: command.stockAvailable,
      minStock: command.minStock || 5,
      images: command.images || [],
    });

    // Save variant
    const savedVariant = await this.variantRepository.create(command.productId, variant);

    this.logger.info('Variant created successfully', { variantId: savedVariant.id });

    return {
      success: true,
      message: 'Variant created successfully',
      variant: {
        id: savedVariant.id!,
        sku: savedVariant.sku,
        price: savedVariant.price,
        stockAvailable: savedVariant.stockAvailable,
      },
    };
  }
}
