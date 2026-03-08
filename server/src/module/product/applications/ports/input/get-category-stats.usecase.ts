import { CategoryStatsResult } from '../../dto/result/category-stats.result';
import { GetCategoryStatsQuery } from '../../dto/query/get-category-stats.query';

export interface IGetCategoryStatsUseCase {
  execute(query: GetCategoryStatsQuery): Promise<CategoryStatsResult[]>;
}
