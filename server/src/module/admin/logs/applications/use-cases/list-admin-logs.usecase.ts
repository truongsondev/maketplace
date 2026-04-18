import { createLogger } from '@/shared/util/logger';
import type { ListAdminLogsQuery, ListAdminLogsResult } from '../dto/admin-logs.dto';
import type { IListAdminLogsUseCase } from '../ports/input/admin-logs.usecase';
import type { IAdminLogsRepository } from '../ports/output/admin-logs.repository';

export class ListAdminLogsUseCase implements IListAdminLogsUseCase {
  private readonly logger = createLogger('ListAdminLogsUseCase');

  constructor(private readonly repository: IAdminLogsRepository) {}

  async execute(query: ListAdminLogsQuery): Promise<ListAdminLogsResult> {
    const page = Number.isFinite(query.page) && query.page > 0 ? Math.floor(query.page) : 1;
    const limit =
      Number.isFinite(query.limit) && query.limit > 0 ? Math.min(100, Math.floor(query.limit)) : 20;

    this.logger.info('Listing admin logs', {
      page,
      limit,
      actorType: query.actorType,
      actorId: query.actorId,
      action: query.action,
      targetType: query.targetType,
      targetId: query.targetId,
    });

    const { items, total } = await this.repository.list({
      ...query,
      page,
      limit,
    });

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
