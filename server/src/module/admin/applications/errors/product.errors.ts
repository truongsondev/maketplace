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
