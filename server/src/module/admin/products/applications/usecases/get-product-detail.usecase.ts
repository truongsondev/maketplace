import { GetProductDetailCommand, GetProductDetailResult } from '../dto';
import { IGetProductDetailUseCase } from '../ports/input';
import { IProductRepository } from '../ports/output';
import { ProductNotFoundError } from '../errors';
import { createLogger } from '@/shared/util/logger';

export class GetProductDetailUseCase implements IGetProductDetailUseCase {
  private readonly logger = createLogger('GetProductDetailUseCase');

  constructor(private readonly productRepository: IProductRepository) {}

  async execute(command: GetProductDetailCommand): Promise<GetProductDetailResult> {
    this.logger.info('Getting product detail', { productId: command.productId });

    const result = await this.productRepository.findByIdWithDetails(command.productId);

    if (!result) {
      throw new ProductNotFoundError(command.productId);
    }

    const { product, variants, images, categories, tags, productAttributes } = result;

    // Calculate stats
    const totalStock = variants.reduce((sum, v) => sum + v.stockAvailable, 0);
    const lowStockVariants = variants.filter((v) => v.stockAvailable < v.minStock).length;

    // Map variants to DTO
    const variantDtos = variants.map((v) => ({
      id: v.id!,
      sku: v.sku,
      attributes: v.attributes,
      price: v.price,
      stockAvailable: v.stockAvailable,
      stockReserved: v.stockReserved,
      minStock: v.minStock,
      status: v.isDeleted ? 'deleted' : 'active',
      createdAt: new Date(),
      images: v.images.map((img) => ({
        id: img.id!,
        url: img.url,
        altText: img.altText,
        sortOrder: img.sortOrder || 0,
        isPrimary: img.isPrimary || false,
        variantId: img.variantId,
      })),
    }));

    // Map images
    const imageDtos = images.map((img: any) => ({
      id: img.id,
      url: img.url,
      altText: img.altText,
      sortOrder: img.sortOrder,
      isPrimary: img.isPrimary,
      variantId: img.variantId,
    }));

    // Map categories
    const categoryDtos = categories.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
    }));

    // Map tags
    const tagDtos = tags.map((tag: any) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    }));

    return {
      id: product.id!,
      name: product.name,
      basePrice: product.basePrice,
      status: product.isDeleted ? 'deleted' : 'active',
      createdAt: product.createdAt!,
      updatedAt: product.updatedAt!,
      variants: variantDtos,
      images: imageDtos,
      categories: categoryDtos,
      tags: tagDtos,
      productAttributes,
      stats: {
        totalVariants: variants.length,
        totalStock,
        lowStockVariants,
        totalImages: images.length + variants.reduce((sum, v) => sum + v.images.length, 0),
      },
    };
  }
}
