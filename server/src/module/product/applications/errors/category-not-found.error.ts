import { ApplicationError } from './application.error';

export class CategoryNotFoundError extends ApplicationError {
  constructor() {
    super('CATEGORY_NOT_FOUND', 'Category not found');
  }
}
