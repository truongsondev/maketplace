import { GetProductsQuery } from '../../dto/query/get-products.query';
import { ProductListResult } from '../../dto/result/product-list.result';

export interface IGetProductsUseCase {
  execute(query: GetProductsQuery): Promise<ProductListResult>;
}
