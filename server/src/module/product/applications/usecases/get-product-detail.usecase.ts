import { GetProductDetailQuery } from '../dto/query/get-product-detail.query';
import {
  ProductDetailResult,
  ProductVariantDetail,
  ProductImageDetail,
  CategoryDetail,
  TagDetail,
  ReviewSummary,
} from '../dto/result/product-detail.result';
import { IGetProductDetailUseCase } from '../ports/input/get-product-detail.usecase';
import { IProductRepository } from '../ports/output/product.repository';
import { Product } from '../../entities/product/product.entity';
import { createLogger } from '@/shared/util/logger';
import { NotFoundError } from '@/error-handlling/notFoundError';

export class GetProductDetailUseCase implements IGetProductDetailUseCase {
  private readonly logger = createLogger('GetProductDetailUseCase');

  constructor(private readonly productRepository: IProductRepository) {}

  async execute(query: GetProductDetailQuery): Promise<ProductDetailResult> {
    this.logger.info('Fetching product detail', { productId: query.id });

    const product = await this.productRepository.findByIdWithDetails(query.id);

    if (!product || product.isDeleted) {
      this.logger.warn('Product not found or deleted', { productId: query.id });
      throw new NotFoundError('Product not found');
    }

    this.logger.info('Product detail fetched successfully', {
      productId: product.id,
      name: product.name,
      variantsCount: product.variants?.length || 0,
      imagesCount: product.images?.length || 0,
    });

    return this.toDetailResult(product);
  }

  private toDetailResult(product: Product): ProductDetailResult {
    // Extract product-level images (variantId = null or undefined)
    const productImages: ProductImageDetail[] = (product.images || [])
      .filter((img) => !img.variantId)
      .map((img) => ({
        id: img.id,
        url: img.url,
        altText: img.altText || null,
        isPrimary: img.isPrimary || false,
        sortOrder: img.sortOrder || 0,
      }))
      .sort((a, b) => {
        // Sort by isPrimary first, then sortOrder
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return a.sortOrder - b.sortOrder;
      });

    // Extract variants with their images
    const variants: ProductVariantDetail[] = (product.variants || [])
      .filter((v) => !v.isDeleted)
      .map((variant) => {
        // Repository includes images directly in variant
        const variantImages: ProductImageDetail[] = (variant.images || [])
          .map((img: any) => ({
            id: img.id,
            url: img.url,
            altText: img.altText || null,
            isPrimary: img.isPrimary || false,
            sortOrder: img.sortOrder || 0,
          }))
          .sort((a: ProductImageDetail, b: ProductImageDetail) => a.sortOrder - b.sortOrder);

        return {
          id: variant.id,
          sku: variant.sku || '',
          attributes: (variant.attributes as Record<string, any>) || {},
          price: Number(variant.price) || 0,
          stockAvailable: variant.stockAvailable || 0,
          images: variantImages,
        };
      });

    // Extract categories
    const categories: CategoryDetail[] = (product.categories || []).map((pc) => ({
      id: pc.category.id,
      name: pc.category.name,
      slug: pc.category.slug,
    }));

    // Extract tags
    const tags: TagDetail[] = (product.tags || []).map((pt) => ({
      id: pt.tag.id,
      name: pt.tag.name,
      slug: pt.tag.slug,
    }));

    // Calculate review summary
    const reviews: ReviewSummary = this.calculateReviewSummary(product.reviews || []);

    return {
      id: product.id,
      name: product.name,
      description: product.description ?? null,
      basePrice: Number(product.basePrice) || 0,
      images: productImages,
      variants,
      categories,
      tags,
      reviews,
      createdAt: product.createdAt || new Date(),
      updatedAt: product.updatedAt || new Date(),
    };
  }

  private calculateReviewSummary(reviews: any[]): ReviewSummary {
    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;
    let validReviewCount = 0;

    for (const review of reviews) {
      const rating = Number(review.rating);
      // Validate rating is between 1-5
      if (rating >= 1 && rating <= 5 && Number.isInteger(rating)) {
        ratingDistribution[rating as 1 | 2 | 3 | 4 | 5]++;
        totalRating += rating;
        validReviewCount++;
      } else {
        this.logger.warn('Invalid rating encountered', { reviewId: review.id, rating });
      }
    }

    if (validReviewCount === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    return {
      averageRating: Number((totalRating / validReviewCount).toFixed(2)),
      totalReviews: validReviewCount,
      ratingDistribution,
    };
  }
}
