import { Product, ProductVariant } from '../../entities/product/product.entity';
import { CreateProductCommand, CreateProductResult } from '../dto';
import { InvalidProductDataError, ProductAlreadyExistsError } from '../errors';
import { ICreateProductUseCase } from '../ports/input/create-product.usecase';
import { IProductRepository } from '../ports/output/product.repository';
import { createLogger } from '@/shared/util/logger';

export class CreateProductUseCase implements ICreateProductUseCase {
  private readonly logger = createLogger('CreateProductUseCase');

  constructor(private readonly productRepository: IProductRepository) {}

  async execute(command: CreateProductCommand): Promise<CreateProductResult> {
    this.logger.info('Starting product creation', { name: command.name });

    // Validate command
    this.validateCommand(command);

    // Check for duplicate SKUs
    for (const variantDto of command.variants) {
      const exists = await this.productRepository.existsBySku(variantDto.sku);
      if (exists) {
        this.logger.warn('Product creation failed: SKU already exists', { sku: variantDto.sku });
        throw new ProductAlreadyExistsError(variantDto.sku);
      }
    }

    // Validate core product fields via entity invariants.
    Product.create({
      name: command.name,
      basePrice: command.basePrice,
    });

    // Create variant entities
    const variants = command.variants.map((v) =>
      ProductVariant.create({
        sku: v.sku,
        attributes: v.attributes,
        price: v.price,
        stockAvailable: v.stockAvailable,
        minStock: v.minStock,
        images: v.images,
      }),
    );

    // Save product with all related data
    const savedProduct = await this.productRepository.saveWithDetails(
      {
        name: command.name,
        basePrice: command.basePrice,
      },
      variants,
      command.categoryIds || [],
      command.tagIds || [],
      command.images || [],
      command.productAttributes || [],
    );

    this.logger.info('Product created successfully', {
      productId: savedProduct.id,
      name: savedProduct.name,
    });

    return {
      productId: savedProduct.id!,
      message: 'Product created successfully',
    };
  }

  private validateCommand(command: CreateProductCommand): void {
    if (!command.name || command.name.trim().length === 0) {
      throw new InvalidProductDataError('Product name is required');
    }

    if (command.basePrice < 0) {
      throw new InvalidProductDataError('Base price must be non-negative');
    }

    // Validate variants
    const skus = new Set<string>();
    for (const variant of command.variants ?? []) {
      if (!variant.sku || variant.sku.trim().length === 0) {
        throw new InvalidProductDataError('Variant SKU is required');
      }

      if (skus.has(variant.sku)) {
        throw new InvalidProductDataError(`Duplicate SKU in request: ${variant.sku}`);
      }
      skus.add(variant.sku);

      if (variant.price < 0) {
        throw new InvalidProductDataError(
          `Variant price must be non-negative for SKU: ${variant.sku}`,
        );
      }

      if (variant.stockAvailable < 0) {
        throw new InvalidProductDataError(
          `Variant stock must be non-negative for SKU: ${variant.sku}`,
        );
      }
    }
  }
}
