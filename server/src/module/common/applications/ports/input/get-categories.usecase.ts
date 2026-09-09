import { GetCategoriesQuery, GetCategoriesResult } from '../../dto';

export interface IGetCategoriesUseCase {
  execute(query: GetCategoriesQuery): Promise<GetCategoriesResult>;
}
