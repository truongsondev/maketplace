import { BulkAssignCategoriesCommand, BulkAssignCategoriesResult } from '../dto';
import { IBulkAssignCategoriesUseCase } from '../ports/input';
import { IProductRepository, ICategoryRepository } from '../ports/output';
import { InvalidProductDataError } from '../errors';
import { createLogger } from '@/shared/util/logger';

export class BulkAssignCategoriesUseCase implements IBulkAssignCategoriesUseCase {
  private readonly logger = createLogger('BulkAssignCategoriesUseCase');

  constructor(
    private readonly productRepository: IProductRepository,
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(command: BulkAssignCategoriesCommand): Promise<BulkAssignCategoriesResult> {
    this.logger.info('Bulk assigning categories', {
      productCount: command.productIds.length,
      categoryCount: command.categoryIds.length,
      mode: command.mode,
    });

    // Validate categories exist
    const categoriesExist = await this.categoryRepository.existsByIds(command.categoryIds);
    if (!categoriesExist) {
      throw new InvalidProductDataError('One or more categories not found');
    }

    // Bulk assign
    await this.productRepository.bulkAssignCategories(
      command.productIds,
      command.categoryIds,
      command.mode,
    );

    this.logger.info('Categories assigned successfully', {
      productCount: command.productIds.length,
    });

    return {
      success: true,
      message: `Categories assigned to ${command.productIds.length} products successfully`,
    };
  }
}
