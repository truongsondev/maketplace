import { GetCategoriesCommand, GetCategoriesResult, CategoryTreeDto } from '../dto';
import { IGetCategoriesUseCase } from '../ports/input';
import { ICategoryRepository } from '../ports/output';
import { createLogger } from '@/shared/util/logger';

export class GetCategoriesUseCase implements IGetCategoriesUseCase {
  private readonly logger = createLogger('GetCategoriesUseCase');

  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute(command: GetCategoriesCommand): Promise<GetCategoriesResult> {
    this.logger.info('Getting categories tree');

    const categories = await this.categoryRepository.findAll();

    // Build tree structure
    const categoryMap = new Map<string, CategoryTreeDto>();
    const rootCategories: CategoryTreeDto[] = [];

    // First pass: create all nodes
    categories.forEach((cat: any) => {
      categoryMap.set(cat.id, {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        parentId: cat.parentId,
        sortOrder: cat.sortOrder,
        children: [],
      });
    });

    // Second pass: build tree
    categories.forEach((cat: any) => {
      const node = categoryMap.get(cat.id)!;
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        rootCategories.push(node);
      }
    });

    // Sort by sortOrder
    const sortTree = (nodes: CategoryTreeDto[]) => {
      nodes.sort((a, b) => a.sortOrder - b.sortOrder);
      nodes.forEach((node) => sortTree(node.children));
    };
    sortTree(rootCategories);

    return {
      categories: rootCategories,
    };
  }
}
