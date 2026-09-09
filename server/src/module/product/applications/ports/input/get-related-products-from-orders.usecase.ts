import { GetRelatedProductsFromOrdersQuery } from '../../dto/query/get-related-products-from-orders.query';
import { RelatedProductsFromOrdersResult } from '../../dto/result/related-products-from-orders.result';

export interface IGetRelatedProductsFromOrdersUseCase {
  execute(
    userId: string,
    query: GetRelatedProductsFromOrdersQuery,
  ): Promise<RelatedProductsFromOrdersResult>;
}
