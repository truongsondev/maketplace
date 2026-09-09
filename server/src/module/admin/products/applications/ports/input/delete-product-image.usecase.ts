import { DeleteProductImageCommand, DeleteProductImageResult } from '../../dto';

export interface IDeleteProductImageUseCase {
  execute(command: DeleteProductImageCommand): Promise<DeleteProductImageResult>;
}
