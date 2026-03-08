import { TagDto } from '../../dto';

export interface ITagRepository {
  findAll(params?: { search?: string; limit?: number; offset?: number }): Promise<TagDto[]>;

  findById(id: string): Promise<TagDto | null>;

  count(params?: { search?: string }): Promise<number>;
}
