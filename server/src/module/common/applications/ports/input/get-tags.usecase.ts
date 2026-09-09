import { GetTagsQuery, GetTagsResult } from '../../dto';

export interface IGetTagsUseCase {
  execute(query: GetTagsQuery): Promise<GetTagsResult>;
}
