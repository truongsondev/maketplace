import {
  CreateVariantCommand,
  UpdateVariantCommand,
  DeleteVariantCommand,
  AdjustStockCommand,
} from '../../applications/dto';
import {
  ICreateVariantUseCase,
  IUpdateVariantUseCase,
  IDeleteVariantUseCase,
  IAdjustStockUseCase,
} from '../../applications/ports/input';

export class VariantController {
  constructor(
    private readonly createVariantUseCase: ICreateVariantUseCase,
    private readonly updateVariantUseCase: IUpdateVariantUseCase,
    private readonly deleteVariantUseCase: IDeleteVariantUseCase,
    private readonly adjustStockUseCase: IAdjustStockUseCase,
  ) {}

  async createVariant(command: CreateVariantCommand) {
    return await this.createVariantUseCase.execute(command);
  }

  async updateVariant(command: UpdateVariantCommand) {
    return await this.updateVariantUseCase.execute(command);
  }

  async deleteVariant(command: DeleteVariantCommand) {
    return await this.deleteVariantUseCase.execute(command);
  }

  async adjustStock(command: AdjustStockCommand) {
    return await this.adjustStockUseCase.execute(command);
  }
}
