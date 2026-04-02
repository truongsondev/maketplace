import { CategoryDto } from '../../dto';

export interface ICategoryRepository {
  findAll(): Promise<CategoryDto[]>;

  findById(id: string): Promise<CategoryDto | null>;

  count(): Promise<number>;
}
