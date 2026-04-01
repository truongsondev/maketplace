import { GetTagsCommand, GetTagsResult } from '../dto';
import { IGetTagsUseCase } from '../ports/input';
import { ITagRepository } from '../ports/output';
import { createLogger } from '@/shared/util/logger';

export class GetTagsUseCase implements IGetTagsUseCase {
  private readonly logger = createLogger('GetTagsUseCase');

  constructor(private readonly tagRepository: ITagRepository) {}

  async execute(command: GetTagsCommand): Promise<GetTagsResult> {
    this.logger.info('Getting tags', { search: command.search });

    const tags = await this.tagRepository.findAll(command);

    return {
      tags: tags.map((tag: any) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
      })),
    };
  }
}
