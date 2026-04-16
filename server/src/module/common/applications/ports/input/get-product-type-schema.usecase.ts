import { GetProductTypeSchemaQuery, ProductTypeSchemaDto } from '../../dto';

export interface IGetProductTypeSchemaUseCase {
  execute(query: GetProductTypeSchemaQuery): Promise<ProductTypeSchemaDto>;
}
