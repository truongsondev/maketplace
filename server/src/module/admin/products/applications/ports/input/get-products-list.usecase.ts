import { GetProductsListCommand, GetProductsListResult } from '../../dto';

export interface IGetProductsListUseCase {
  execute(command: GetProductsListCommand): Promise<GetProductsListResult>;
}
