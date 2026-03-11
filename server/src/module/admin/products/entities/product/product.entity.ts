export interface ProductProps {
  id?: string;
  name: string;
  description?: string;
  basePrice: number;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductVariantProps {
  id?: string;
  productId?: string;
  sku: string;
  attributes: Record<string, any>;
  price: number;
  stockAvailable: number;
  stockReserved?: number;
  minStock?: number;
  isDeleted?: boolean;
  images: ProductImageProps[];
}

export interface ProductImageProps {
  id?: string;
  productId?: string;
  variantId?: string;
  url: string;
  altText?: string;
  sortOrder?: number;
  isPrimary?: boolean;
}

export interface ProductCategoryProps {
  productId?: string;
  categoryId: string;
}

export interface ProductTagProps {
  productId?: string;
  tagId: string;
}

export class Product {
  private readonly _id?: string;
  private _name: string;
  private _description?: string;
  private _basePrice: number;
  private _isDeleted: boolean;
  private _createdAt?: Date;
  private _updatedAt?: Date;

  private constructor(props: ProductProps) {
    this._id = props.id;
    this._name = props.name;
    this._description = props.description;
    this._basePrice = props.basePrice;
    this._isDeleted = props.isDeleted ?? false;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  static create(props: ProductProps): Product {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Product name is required');
    }
    if (props.basePrice < 0) {
      throw new Error('Base price must be non-negative');
    }
    return new Product(props);
  }

  static fromPersistence(props: ProductProps): Product {
    return new Product(props);
  }

  get id(): string | undefined {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get description(): string | undefined {
    return this._description;
  }

  get basePrice(): number {
    return this._basePrice;
  }

  get isDeleted(): boolean {
    return this._isDeleted;
  }

  get createdAt(): Date | undefined {
    return this._createdAt;
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Product name is required');
    }
    this._name = name;
  }

  updateDescription(description: string): void {
    this._description = description;
  }

  updateBasePrice(price: number): void {
    if (price < 0) {
      throw new Error('Base price must be non-negative');
    }
    this._basePrice = price;
  }

  softDelete(): void {
    this._isDeleted = true;
  }

  restore(): void {
    this._isDeleted = false;
  }
}

export class ProductVariant {
  private readonly _id?: string;
  private readonly _productId?: string;
  private _sku: string;
  private _attributes: Record<string, any>;
  private _price: number;
  private _stockAvailable: number;
  private _stockReserved: number;
  private _minStock: number;
  private _isDeleted: boolean;
  private _images: ProductImageProps[] = [];

  private constructor(props: ProductVariantProps) {
    this._id = props.id;
    this._productId = props.productId;
    this._sku = props.sku;
    this._attributes = props.attributes;
    this._price = props.price;
    this._stockAvailable = props.stockAvailable;
    this._stockReserved = props.stockReserved ?? 0;
    this._minStock = props.minStock ?? 5;
    this._isDeleted = props.isDeleted ?? false;
    this._images = props.images || [];
  }

  static create(props: ProductVariantProps): ProductVariant {
    if (!props.sku || props.sku.trim().length === 0) {
      throw new Error('SKU is required');
    }
    if (props.price < 0) {
      throw new Error('Price must be non-negative');
    }
    if (props.stockAvailable < 0) {
      throw new Error('Stock available must be non-negative');
    }
    return new ProductVariant(props);
  }

  static fromPersistence(props: ProductVariantProps): ProductVariant {
    return new ProductVariant(props);
  }

  get id(): string | undefined {
    return this._id;
  }

  get productId(): string | undefined {
    return this._productId;
  }

  get sku(): string {
    return this._sku;
  }

  get images(): ProductImageProps[] {
    return this._images;
  }

  get attributes(): Record<string, any> {
    return this._attributes;
  }

  get price(): number {
    return this._price;
  }

  get stockAvailable(): number {
    return this._stockAvailable;
  }

  get stockReserved(): number {
    return this._stockReserved;
  }

  get minStock(): number {
    return this._minStock;
  }

  get isDeleted(): boolean {
    return this._isDeleted;
  }

  updatePrice(price: number): void {
    if (price < 0) {
      throw new Error('Price must be non-negative');
    }
    this._price = price;
  }

  updateStock(available: number): void {
    if (available < 0) {
      throw new Error('Stock available must be non-negative');
    }
    this._stockAvailable = available;
  }

  reserveStock(quantity: number): void {
    if (this._stockAvailable < quantity) {
      throw new Error('Insufficient stock');
    }
    this._stockAvailable -= quantity;
    this._stockReserved += quantity;
  }

  releaseStock(quantity: number): void {
    this._stockAvailable += quantity;
    this._stockReserved -= quantity;
  }
}
