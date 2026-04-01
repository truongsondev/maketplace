import { UpdateProductCommand, UpdateProductResult } from '../dto';
import { IUpdateProductUseCase } from '../ports/input';
import { IProductRepository, IVariantRepository, IPriceHistoryRepository } from '../ports/output';
import { ProductNotFoundError, InvalidProductDataError } from '../errors';
import { ProductVariant } from '../../entities/product/product.entity';
import { createLogger } from '@/shared/util/logger';

export class UpdateProductUseCase implements IUpdateProductUseCase {
  private readonly logger = createLogger('UpdateProductUseCase');

  constructor(
    private readonly productRepository: IProductRepository,
    private readonly variantRepository: IVariantRepository,
    private readonly priceHistoryRepository: IPriceHistoryRepository,
  ) {}

  async execute(command: UpdateProductCommand): Promise<UpdateProductResult> {
    this.logger.info('Updating product', { productId: command.productId });

    // Check if product exists
    const existingProduct = await this.productRepository.findByIdWithDetails(command.productId);
    if (!existingProduct) {
      throw new ProductNotFoundError(command.productId);
    }

    let priceChanged = false;

    // Check for price changes
    if (
      command.basePrice !== undefined &&
      command.basePrice !== existingProduct.product.basePrice
    ) {
      priceChanged = true;
      await this.priceHistoryRepository.create({
        productId: command.productId,
        oldPrice: existingProduct.product.basePrice,
        newPrice: command.basePrice,
      });
    }

    // Check variant price changes
    if (command.variants) {
      for (const variantDto of command.variants) {
        if (variantDto.id) {
          const existingVariant = existingProduct.variants.find((v) => v.id === variantDto.id);
          if (existingVariant && variantDto.price !== existingVariant.price) {
            priceChanged = true;
            await this.priceHistoryRepository.create({
              productId: command.productId,
              variantId: variantDto.id,
              oldPrice: existingVariant.price,
              newPrice: variantDto.price,
            });
          }
        }
      }
    }

    // Check for duplicate SKUs in new variants
    if (command.variants) {
      for (const variantDto of command.variants) {
        if (!variantDto.id) {
          // New variant
          const exists = await this.productRepository.existsBySku(variantDto.sku);
          if (exists) {
            throw new InvalidProductDataError(`SKU '${variantDto.sku}' already exists`);
          }
        }
      }
    }

    // Prepare update data
    const productData: any = {};
    if (command.name !== undefined) productData.name = command.name;
    if (command.description !== undefined) productData.description = command.description;
    if (command.basePrice !== undefined) productData.basePrice = command.basePrice;
    if (command.status !== undefined) productData.isDeleted = command.status === 'inactive';

    // Prepare variants
    const variants = command.variants
      ? command.variants.map((v) =>
          ProductVariant.create({
            id: v.id,
            sku: v.sku,
            attributes: v.attributes,
            price: v.price,
            stockAvailable: v.stockAvailable,
            minStock: v.minStock || 5,
            images: v.images || [],
          }),
        )
      : undefined;

    // Update product with all details
    await this.productRepository.updateWithDetails(
      command.productId,
      productData,
      variants,
      command.categoryIds,
      command.tagIds,
      command.images,
    );

    this.logger.info('Product updated successfully', { productId: command.productId });

    return {
      productId: command.productId,
      message: 'Product updated successfully',
      priceChanged,
    };
  }
}
