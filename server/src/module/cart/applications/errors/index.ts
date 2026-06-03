export class VariantRequiredError extends Error {
  constructor() {
    super('Vui lòng chọn phân loại sản phẩm.');
    this.name = 'VariantRequiredError';
  }
}

export class VariantNotFoundError extends Error {
  constructor(variantId?: string) {
    super(
      variantId
        ? `Phân loại ${variantId} không tồn tại hoặc đã bị xoá.`
        : 'Phân loại sản phẩm không tồn tại hoặc đã bị xoá.',
    );
    this.name = 'VariantNotFoundError';
  }
}

export class ProductNotFoundError extends Error {
  constructor(productId?: string) {
    super(
      productId
        ? `Sản phẩm ${productId} không tồn tại hoặc đã bị xoá.`
        : 'Sản phẩm không tồn tại hoặc đã bị xoá.',
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
      `Không đủ tồn kho cho phân loại ${details.sku}. Yêu cầu: ${details.requested}, còn lại: ${details.available}.`,
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
      `Không thể thêm quá ${details.maxQuantity} sản phẩm cho cùng một phân loại. Hiện có trong giỏ: ${details.currentInCart}, yêu cầu thêm: ${details.requested}.`,
    );
    this.name = 'ExceedsMaxQuantityError';
  }
}

export class InvalidQuantityError extends Error {
  constructor(quantity: number) {
    super(`Số lượng phải từ 1 đến 10. Giá trị nhận được: ${quantity}.`);
    this.name = 'InvalidQuantityError';
  }
}

export class CartItemNotFoundError extends Error {
  constructor(itemId?: string) {
    super(itemId ? `Không tìm thấy sản phẩm ${itemId} trong giỏ hàng.` : 'Không tìm thấy sản phẩm trong giỏ hàng.');
    this.name = 'CartItemNotFoundError';
  }
}
