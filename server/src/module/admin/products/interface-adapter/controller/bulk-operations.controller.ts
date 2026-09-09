import { BulkAssignCategoriesCommand, BulkAssignTagsCommand } from '../../applications/dto';
import {
  IBulkAssignCategoriesUseCase,
  IBulkAssignTagsUseCase,
} from '../../applications/ports/input';

export class BulkOperationsController {
  constructor(
    private readonly bulkAssignCategoriesUseCase: IBulkAssignCategoriesUseCase,
    private readonly bulkAssignTagsUseCase: IBulkAssignTagsUseCase,
  ) {}

  async bulkAssignCategories(command: BulkAssignCategoriesCommand) {
    return await this.bulkAssignCategoriesUseCase.execute(command);
  }

  async bulkAssignTags(command: BulkAssignTagsCommand) {
    return await this.bulkAssignTagsUseCase.execute(command);
  }
}
