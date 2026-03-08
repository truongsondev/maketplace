import { Category } from '../../../entities/category/category.entity';

export interface ICategoryRepository {
  findAllWithProductCount(): Promise<Category[]>;
}
