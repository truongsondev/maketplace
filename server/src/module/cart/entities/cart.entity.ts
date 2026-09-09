export class Cart {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly createdAt: Date,
    public items: CartItem[] = [],
  ) {}

  get totalItems(): number {
    return this.items.length;
  }

  get totalQuantity(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  get totalAmount(): number {
    return this.items.reduce((sum, item) => sum + item.subtotal, 0);
  }
}

export class CartItem {
  constructor(
    public readonly id: string,
    public readonly cartId: string,
    public readonly productId: string,
    public readonly productName: string,
    public readonly variantId: string, // Required - variant-first approach
    public readonly variantInfo: VariantInfo,
    public readonly image: ProductImage | null,
    public quantity: number,
  ) {}

  get unitPrice(): number {
    return this.variantInfo.price;
  }

  get subtotal(): number {
    return this.quantity * this.unitPrice;
  }
}

export interface VariantInfo {
  productName: string;
  sku: string;
  attributes: Record<string, any>;
  price: number;
  stockAvailable: number;
}

export interface ProductImage {
  url: string;
  altText: string | null;
  isPrimary: boolean;
}
