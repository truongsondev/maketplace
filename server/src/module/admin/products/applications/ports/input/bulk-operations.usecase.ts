import {
  BulkAssignCategoriesCommand,
  BulkAssignCategoriesResult,
  BulkAssignTagsCommand,
  BulkAssignTagsResult,
} from '../../dto';

export interface IBulkAssignCategoriesUseCase {
  execute(command: BulkAssignCategoriesCommand): Promise<BulkAssignCategoriesResult>;
}

export interface IBulkAssignTagsUseCase {
  execute(command: BulkAssignTagsCommand): Promise<BulkAssignTagsResult>;
}
