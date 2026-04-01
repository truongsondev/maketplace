import { ExportProductsCommand, ExportProductsResult } from '../../dto';

export interface IExportProductsUseCase {
  execute(command: ExportProductsCommand): Promise<ExportProductsResult>;
}
