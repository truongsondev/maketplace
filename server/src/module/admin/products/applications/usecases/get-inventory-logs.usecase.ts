import { GetInventoryLogsCommand, GetInventoryLogsResult } from '../dto';
import { IGetInventoryLogsUseCase } from '../ports/input';
import { IInventoryRepository } from '../ports/output';
import { createLogger } from '@/shared/util/logger';

export class GetInventoryLogsUseCase implements IGetInventoryLogsUseCase {
  private readonly logger = createLogger('GetInventoryLogsUseCase');

  constructor(private readonly inventoryRepository: IInventoryRepository) {}

  async execute(command: GetInventoryLogsCommand): Promise<GetInventoryLogsResult> {
    this.logger.info('Getting inventory logs', { command });

    const page = command.page || 1;
    const limit = command.limit || 50;

    const result = await this.inventoryRepository.findLogsWithFilters({
      ...command,
      page,
      limit,
    });

    const totalPages = Math.ceil(result.total / limit);

    return {
      items: result.items.map((log: any) => ({
        id: log.id,
        variantId: log.variantId,
        variant: {
          sku: log.variant.sku,
          product: {
            id: log.variant.product.id,
            name: log.variant.product.name,
          },
        },
        action: log.action,
        quantity: log.quantity,
        referenceId: log.referenceId,
        createdAt: log.createdAt,
      })),
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages,
      },
    };
  }
}
