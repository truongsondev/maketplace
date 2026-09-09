import { GetInventoryLogsCommand } from '../../dto';

export interface IInventoryRepository {
  findLogsWithFilters(command: GetInventoryLogsCommand): Promise<{
    items: any[];
    total: number;
  }>;

  createLog(data: {
    variantId: string;
    action: 'IMPORT' | 'EXPORT' | 'RETURN' | 'ADJUSTMENT';
    quantity: number;
    referenceId?: string;
  }): Promise<{ id: string }>;
}
