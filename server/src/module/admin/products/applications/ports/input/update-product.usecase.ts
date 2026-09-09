import { UpdateProductCommand, UpdateProductResult } from '../../dto';

export interface IUpdateProductUseCase {
  execute(command: UpdateProductCommand): Promise<UpdateProductResult>;
}
