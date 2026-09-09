import { GetProductsListCommand, GetProductsListResult } from '../dto';
import { IGetProductsListUseCase } from '../ports/input';
import { IProductRepository } from '../ports/output';
import { createLogger } from '@/shared/util/logger';

export class GetProductsListUseCase implements IGetProductsListUseCase {
  private readonly logger = createLogger('GetProductsListUseCase');

  constructor(private readonly productRepository: IProductRepository) {}

  async execute(command: GetProductsListCommand): Promise<GetProductsListResult> {
    this.logger.info('Getting products list', { command });

    // Set defaults
    const page = command.page || 1;
    const limit = Math.min(command.limit || 20, 100); // Max 100
    const sortBy = command.sortBy || 'createdAt';
    const sortOrder = command.sortOrder || 'desc';
    const status = command.status || 'active';

    // Fetch products with filters
    const result = await this.productRepository.findManyWithFilters({
      ...command,
      page,
      limit,
      sortBy,
      sortOrder,
      status,
    });

    const totalPages = Math.ceil(result.total / limit);

    return {
      items: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages,
      },
      aggregations: result.aggregations,
    };
  }
}
