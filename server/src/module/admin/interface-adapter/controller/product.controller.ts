import { CreateProductCommand } from '../../applications/dto';
import { ICreateProductUseCase } from '../../applications/ports/input';

export interface CreateProductHttpResponse {
  productId: string;
  message: string;
}

export class ProductController {
  constructor(private readonly createProductUseCase: ICreateProductUseCase) {}

  async createProduct(command: CreateProductCommand): Promise<CreateProductHttpResponse> {
    const result = await this.createProductUseCase.execute(command);
    return result;
  }
}
