import { GetInventoryLogsCommand, GetInventoryLogsResult } from '../../dto';

export interface IGetInventoryLogsUseCase {
  execute(command: GetInventoryLogsCommand): Promise<GetInventoryLogsResult>;
}
