import { GetProductsQuery } from '../dto/query/get-products.query';
import { ProductListResult, ProductSummary } from '../dto/result/product-list.result';
import { IGetProductsUseCase } from '../ports/input/get-products.usecase';
import { IProductRepository, ProductFilters } from '../ports/output/product.repository';
import { Product } from '../../entities/product/product.entity';
import { createLogger } from '@/shared/util/logger';

export class GetProductsUseCase implements IGetProductsUseCase {
  private readonly logger = createLogger('GetProductsUseCase');

  constructor(private readonly productRepository: IProductRepository) {}

  async execute(query: GetProductsQuery): Promise<ProductListResult> {
    this.logger.debug('Fetching products', { query });

    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 && query.limit <= 100 ? query.limit : 10;

    const filters: ProductFilters = {
      categorySlugOrId: query.category,
      size: query.size,
      color: query.color,
      usageOccasion: query.usageOccasion,
      sortField: 'createdAt',
      sortOrder: 'desc',
    };

    const normalizedSearch = query.search?.trim();
    if (normalizedSearch) {
      filters.search = normalizedSearch;
    }

    if (query.sort) {
      const [field, order] = query.sort.split(':');
      if (field === 'createdAt') {
        filters.sortField = 'createdAt';
      }
      if (order === 'asc' || order === 'desc') {
        filters.sortOrder = order;
      }
    }

    if (query.priceRange) {
      const [minStr, maxStr] = query.priceRange.split('-');
      if (minStr) {
        const min = parseFloat(minStr);
        if (!isNaN(min) && min >= 0) filters.minPrice = min;
      }
      if (maxStr) {
        const max = parseFloat(maxStr);
        if (!isNaN(max) && max >= 0) filters.maxPrice = max;
      }
    }

    const { products, total, aggregations } = await this.productRepository.findWithFilters(
      filters,
      {
        page,
        limit,
      },
    );

    this.logger.info('Products fetched successfully', {
      total,
      page,
      limit,
      resultsCount: products.length,
      filters,
    });

    return {
      products: products.map((p) => this.toSummary(p)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      aggregations,
    };
  }

  private toSummary(product: Product): ProductSummary {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      imageUrl: product.imageUrl,
      minPrice: product.minPrice,
      originalPrice: product.originalPrice,
      discountPercent: product.discountPercent,
      isNew: product.isNew,
      isSale: product.isSale,
    };
  }
}
