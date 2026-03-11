import { GetProductDetailCommand, GetProductDetailResult } from '../../dto';

export interface IGetProductDetailUseCase {
  execute(command: GetProductDetailCommand): Promise<GetProductDetailResult>;
}
