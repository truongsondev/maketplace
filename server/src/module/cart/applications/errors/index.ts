export class VariantRequiredError extends Error {
  constructor() {
    super('Variant ID is required. Please select a product variant.');
    this.name = 'VariantRequiredError';
  }
}

export class VariantNotFoundError extends Error {
  constructor(variantId?: string) {
    super(
      variantId
        ? `Variant ${variantId} does not exist or has been deleted`
        : 'Variant does not exist or has been deleted',
    );
    this.name = 'VariantNotFoundError';
  }
}

export class ProductNotFoundError extends Error {
  constructor(productId?: string) {
    super(
      productId
        ? `Product ${productId} does not exist or has been deleted`
        : 'Product does not exist or has been deleted',
    );
    this.name = 'ProductNotFoundError';
  }
}

export class InsufficientStockError extends Error {
  constructor(
    public readonly details: {
      variantId: string;
      sku: string;
      requested: number;
      available: number;
    },
  ) {
    super(
      `Not enough stock available for variant ${details.sku}. Requested: ${details.requested}, Available: ${details.available}`,
    );
    this.name = 'InsufficientStockError';
  }
}

export class ExceedsMaxQuantityError extends Error {
  constructor(
    public readonly details: {
      maxQuantity: number;
      currentInCart: number;
      requested: number;
    },
  ) {
    super(
      `Cannot add more than ${details.maxQuantity} items of this variant to cart. Currently in cart: ${details.currentInCart}, Requested: ${details.requested}`,
    );
    this.name = 'ExceedsMaxQuantityError';
  }
}

export class InvalidQuantityError extends Error {
  constructor(quantity: number) {
    super(`Quantity must be between 1 and 10. Received: ${quantity}`);
    this.name = 'InvalidQuantityError';
  }
}

export class CartItemNotFoundError extends Error {
  constructor(itemId?: string) {
    super(itemId ? `Cart item ${itemId} not found` : 'Cart item not found');
    this.name = 'CartItemNotFoundError';
  }
}
