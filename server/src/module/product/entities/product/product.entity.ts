export interface ProductProps {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  minPrice: number;
  originalPrice?: number;
  discountPercent?: number;
}

export class Product {
  private constructor(private readonly props: ProductProps) {}

  get id(): string {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get slug(): string {
    return this.props.slug;
  }
  get imageUrl(): string | null {
    return this.props.imageUrl;
  }
  get minPrice(): number {
    return this.props.minPrice;
  }
  get originalPrice(): number | undefined {
    return this.props.originalPrice;
  }
  get discountPercent(): number | undefined {
    return this.props.discountPercent;
  }

  hasDiscount(): boolean {
    return !!this.props.discountPercent && this.props.discountPercent > 0;
  }

  isAvailable(): boolean {
    return this.props.minPrice > 0;
  }

  static fromPersistence(props: ProductProps): Product {
    return new Product(props);
  }
}
