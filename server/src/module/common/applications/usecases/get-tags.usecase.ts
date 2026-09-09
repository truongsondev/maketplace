import { GetTagsQuery, GetTagsResult } from '../dto';
import { IGetTagsUseCase } from '../ports/input';
import { ITagRepository } from '../ports/output';
import { createLogger } from '@/shared/util/logger';

export class GetTagsUseCase implements IGetTagsUseCase {
  private readonly logger = createLogger('GetTagsUseCase');

  constructor(private readonly tagRepository: ITagRepository) {}

  async execute(query: GetTagsQuery): Promise<GetTagsResult> {
    this.logger.info('Getting tags', query);

    const { search, limit = 50, offset = 0 } = query;

    const [tags, total] = await Promise.all([
      this.tagRepository.findAll({
        search,
        limit,
        offset,
      }),
      this.tagRepository.count({
        search,
      }),
    ]);

    this.logger.info('Tags retrieved', {
      count: tags.length,
      total,
      limit,
      offset,
    });

    return {
      tags,
      total,
    };
  }
}
