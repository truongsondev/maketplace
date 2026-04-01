import { GetInventoryLogsCommand } from '../../applications/dto';
import { IGetInventoryLogsUseCase } from '../../applications/ports/input';

export class InventoryController {
  constructor(private readonly getInventoryLogsUseCase: IGetInventoryLogsUseCase) {}

  async getInventoryLogs(command: GetInventoryLogsCommand) {
    return await this.getInventoryLogsUseCase.execute(command);
  }
}
