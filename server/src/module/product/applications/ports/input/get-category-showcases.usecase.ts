import { GetCategoryShowcasesQuery } from '../../dto/query/get-category-showcases.query';
import { CategoryShowcaseResult } from '../../dto/result/category-showcase.result';

export interface IGetCategoryShowcasesUseCase {
  execute(query: GetCategoryShowcasesQuery): Promise<CategoryShowcaseResult[]>;
}
