import { ProductTypeSchemaDto } from '../../dto';

export interface IProductTypeSchemaRepository {
  getSchemaByCategoryId(categoryId: string): Promise<ProductTypeSchemaDto>;
}
