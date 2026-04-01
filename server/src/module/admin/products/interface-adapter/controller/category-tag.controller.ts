import { GetCategoriesCommand, GetTagsCommand } from '../../applications/dto';
import { IGetCategoriesUseCase, IGetTagsUseCase } from '../../applications/ports/input';

export class CategoryTagController {
  constructor(
    private readonly getCategoriesUseCase: IGetCategoriesUseCase,
    private readonly getTagsUseCase: IGetTagsUseCase,
  ) {}

  async getCategories(command: GetCategoriesCommand) {
    return await this.getCategoriesUseCase.execute(command);
  }

  async getTags(command: GetTagsCommand) {
    return await this.getTagsUseCase.execute(command);
  }
}
