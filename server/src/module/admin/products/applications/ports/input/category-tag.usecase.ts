import {
  GetCategoriesCommand,
  GetCategoriesResult,
  GetTagsCommand,
  GetTagsResult,
} from '../../dto';

export interface IGetCategoriesUseCase {
  execute(command: GetCategoriesCommand): Promise<GetCategoriesResult>;
}

export interface IGetTagsUseCase {
  execute(command: GetTagsCommand): Promise<GetTagsResult>;
}
