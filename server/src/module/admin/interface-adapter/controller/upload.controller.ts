import {
  GenerateSignatureCommand,
  GenerateSignatureResult,
  SaveProductImageCommand,
  SaveProductImageResult,
  DeleteProductImageCommand,
  DeleteProductImageResult,
} from '../../applications/dto';
import { IGenerateSignatureUseCase } from '../../applications/ports/input/generate-signature.usecase';
import { ISaveProductImageUseCase } from '../../applications/ports/input/save-product-image.usecase';
import { IDeleteProductImageUseCase } from '../../applications/ports/input/delete-product-image.usecase';

export class UploadController {
  constructor(
    private readonly generateSignatureUseCase: IGenerateSignatureUseCase,
    private readonly saveProductImageUseCase: ISaveProductImageUseCase,
    private readonly deleteProductImageUseCase: IDeleteProductImageUseCase,
  ) {}

  generateSignature(command: GenerateSignatureCommand): GenerateSignatureResult {
    return this.generateSignatureUseCase.execute(command);
  }

  async saveProductImage(command: SaveProductImageCommand): Promise<SaveProductImageResult> {
    return this.saveProductImageUseCase.execute(command);
  }

  async deleteProductImage(command: DeleteProductImageCommand): Promise<DeleteProductImageResult> {
    return this.deleteProductImageUseCase.execute(command);
  }
}
