import { CategoryDto } from '../../dto';

export interface ICategoryRepository {
  findAll(params?: { parentId?: string; includeChildren?: boolean }): Promise<CategoryDto[]>;

  findById(id: string): Promise<CategoryDto | null>;

  count(params?: { parentId?: string }): Promise<number>;
}
