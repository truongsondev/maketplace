import {
  DeleteProductCommand,
  DeleteProductResult,
  RestoreProductCommand,
  RestoreProductResult,
  BulkDeleteProductsCommand,
  BulkDeleteProductsResult,
} from '../../dto';

export interface IDeleteProductUseCase {
  execute(command: DeleteProductCommand): Promise<DeleteProductResult>;
}

export interface IRestoreProductUseCase {
  execute(command: RestoreProductCommand): Promise<RestoreProductResult>;
}

export interface IBulkDeleteProductsUseCase {
  execute(command: BulkDeleteProductsCommand): Promise<BulkDeleteProductsResult>;
}
