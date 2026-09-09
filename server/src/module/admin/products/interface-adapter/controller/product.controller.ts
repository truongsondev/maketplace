import {
  CreateProductCommand,
  GetProductsListCommand,
  GetProductDetailCommand,
  UpdateProductCommand,
  DeleteProductCommand,
  RestoreProductCommand,
  BulkDeleteProductsCommand,
  ExportProductsCommand,
} from '../../applications/dto';
import {
  ICreateProductUseCase,
  IGetProductsListUseCase,
  IGetProductDetailUseCase,
  IUpdateProductUseCase,
  IDeleteProductUseCase,
  IRestoreProductUseCase,
  IBulkDeleteProductsUseCase,
  IExportProductsUseCase,
} from '../../applications/ports/input';

export class ProductController {
  constructor(
    private readonly createProductUseCase: ICreateProductUseCase,
    private readonly getProductsListUseCase: IGetProductsListUseCase,
    private readonly getProductDetailUseCase: IGetProductDetailUseCase,
    private readonly updateProductUseCase: IUpdateProductUseCase,
    private readonly deleteProductUseCase: IDeleteProductUseCase,
    private readonly restoreProductUseCase: IRestoreProductUseCase,
    private readonly bulkDeleteProductsUseCase: IBulkDeleteProductsUseCase,
    private readonly exportProductsUseCase: IExportProductsUseCase,
  ) {}

  async createProduct(command: CreateProductCommand) {
    return await this.createProductUseCase.execute(command);
  }

  async getProductsList(command: GetProductsListCommand) {
    return await this.getProductsListUseCase.execute(command);
  }

  async getProductDetail(command: GetProductDetailCommand) {
    return await this.getProductDetailUseCase.execute(command);
  }

  async updateProduct(command: UpdateProductCommand) {
    return await this.updateProductUseCase.execute(command);
  }

  async deleteProduct(command: DeleteProductCommand) {
    return await this.deleteProductUseCase.execute(command);
  }

  async restoreProduct(command: RestoreProductCommand) {
    return await this.restoreProductUseCase.execute(command);
  }

  async bulkDeleteProducts(command: BulkDeleteProductsCommand) {
    return await this.bulkDeleteProductsUseCase.execute(command);
  }

  async exportProducts(command: ExportProductsCommand) {
    return await this.exportProductsUseCase.execute(command);
  }
}
