import { GetProductDetailQuery } from '../dto/query/get-product-detail.query';
import { ProductDetailResult } from '../dto/result/product-detail.result';

export interface IGetProductDetailUseCase {
  execute(query: GetProductDetailQuery): Promise<ProductDetailResult>;
}
