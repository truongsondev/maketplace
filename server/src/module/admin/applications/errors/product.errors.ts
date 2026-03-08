export class ProductAlreadyExistsError extends Error {
  constructor(sku: string) {
    super(`Product with SKU "${sku}" already exists`);
    this.name = 'ProductAlreadyExistsError';
  }
}

export class ProductNotFoundError extends Error {
  constructor(id: string) {
    super(`Product with id "${id}" not found`);
    this.name = 'ProductNotFoundError';
  }
}

export class InvalidProductDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidProductDataError';
  }
}

export class CategoryNotFoundError extends Error {
  constructor(categoryIds: string[]) {
    super(`Categories not found: ${categoryIds.join(', ')}`);
    this.name = 'CategoryNotFoundError';
  }
}

export class TagNotFoundError extends Error {
  constructor(tagIds: string[]) {
    super(`Tags not found: ${tagIds.join(', ')}`);
    this.name = 'TagNotFoundError';
  }
}

export class ImageNotFoundError extends Error {
  constructor(id: string) {
    super(`Image with id "${id}" not found`);
    this.name = 'ImageNotFoundError';
  }
}
