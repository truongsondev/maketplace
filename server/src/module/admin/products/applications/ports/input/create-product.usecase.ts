import { CreateProductCommand, CreateProductResult } from '../../dto';

export interface ICreateProductUseCase {
  execute(command: CreateProductCommand): Promise<CreateProductResult>;
}
