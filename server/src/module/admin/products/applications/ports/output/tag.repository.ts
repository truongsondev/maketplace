import { GetTagsCommand } from '../../dto';

export interface ITagRepository {
  findAll(command: GetTagsCommand): Promise<any[]>;

  findByIds(ids: string[]): Promise<any[]>;

  existsByIds(ids: string[]): Promise<boolean>;
}
