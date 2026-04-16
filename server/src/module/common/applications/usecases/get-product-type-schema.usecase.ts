import { createLogger } from '@/shared/util/logger';
import { GetProductTypeSchemaQuery, ProductTypeSchemaDto } from '../dto';
import { IGetProductTypeSchemaUseCase } from '../ports/input';
import { IProductTypeSchemaRepository } from '../ports/output';

export class GetProductTypeSchemaUseCase implements IGetProductTypeSchemaUseCase {
  private readonly logger = createLogger('GetProductTypeSchemaUseCase');

  constructor(private readonly repo: IProductTypeSchemaRepository) {}

  async execute(query: GetProductTypeSchemaQuery): Promise<ProductTypeSchemaDto> {
    const categoryId = String(query.categoryId ?? '').trim();
    if (!categoryId) {
      return { productType: null, variantAxisAttributes: [] };
    }

    this.logger.info('Resolving product type schema', { categoryId });
    return await this.repo.getSchemaByCategoryId(categoryId);
  }
}
