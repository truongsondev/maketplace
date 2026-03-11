import {
  CreateVariantCommand,
  CreateVariantResult,
  UpdateVariantCommand,
  UpdateVariantResult,
  DeleteVariantCommand,
  DeleteVariantResult,
  AdjustStockCommand,
  AdjustStockResult,
} from '../../dto';

export interface ICreateVariantUseCase {
  execute(command: CreateVariantCommand): Promise<CreateVariantResult>;
}

export interface IUpdateVariantUseCase {
  execute(command: UpdateVariantCommand): Promise<UpdateVariantResult>;
}

export interface IDeleteVariantUseCase {
  execute(command: DeleteVariantCommand): Promise<DeleteVariantResult>;
}

export interface IAdjustStockUseCase {
  execute(command: AdjustStockCommand): Promise<AdjustStockResult>;
}
