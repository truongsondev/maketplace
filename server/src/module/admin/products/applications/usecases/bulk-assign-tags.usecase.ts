import { BulkAssignTagsCommand, BulkAssignTagsResult } from '../dto';
import { IBulkAssignTagsUseCase } from '../ports/input';
import { IProductRepository, ITagRepository } from '../ports/output';
import { InvalidProductDataError } from '../errors';
import { createLogger } from '@/shared/util/logger';

export class BulkAssignTagsUseCase implements IBulkAssignTagsUseCase {
  private readonly logger = createLogger('BulkAssignTagsUseCase');

  constructor(
    private readonly productRepository: IProductRepository,
    private readonly tagRepository: ITagRepository,
  ) {}

  async execute(command: BulkAssignTagsCommand): Promise<BulkAssignTagsResult> {
    this.logger.info('Bulk assigning tags', {
      productCount: command.productIds.length,
      tagCount: command.tagIds.length,
      mode: command.mode,
    });

    // Validate tags exist
    const tagsExist = await this.tagRepository.existsByIds(command.tagIds);
    if (!tagsExist) {
      throw new InvalidProductDataError('One or more tags not found');
    }

    // Bulk assign
    await this.productRepository.bulkAssignTags(command.productIds, command.tagIds, command.mode);

    this.logger.info('Tags assigned successfully', {
      productCount: command.productIds.length,
    });

    return {
      success: true,
      message: `Tags assigned to ${command.productIds.length} products successfully`,
    };
  }
}
