export interface ICategoryRepository {
  findAll(): Promise<any[]>;

  findByIds(ids: string[]): Promise<any[]>;

  existsByIds(ids: string[]): Promise<boolean>;
}
