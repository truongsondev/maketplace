export interface ProductProps {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  minPrice: number;
  originalPrice?: number;
  discountPercent?: number;
  isNew?: boolean;
  isSale?: boolean;
  // For detailed view
  description?: string | null;
  basePrice?: number;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  variants?: any[];
  images?: any[];
  categories?: any[];
  tags?: any[];
  reviews?: any[];
  productAttributes?: any[];
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
  get isNew(): boolean {
    return this.props.isNew ?? false;
  }
  get isSale(): boolean {
    return this.props.isSale ?? false;
  }
  get description(): string | null | undefined {
    return this.props.description;
  }
  get basePrice(): number | undefined {
    return this.props.basePrice;
  }
  get isDeleted(): boolean | undefined {
    return this.props.isDeleted;
  }
  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }
  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }
  get variants(): any[] | undefined {
    return this.props.variants;
  }
  get images(): any[] | undefined {
    return this.props.images;
  }
  get categories(): any[] | undefined {
    return this.props.categories;
  }
  get tags(): any[] | undefined {
    return this.props.tags;
  }
  get reviews(): any[] | undefined {
    return this.props.reviews;
  }
  get productAttributes(): any[] | undefined {
    return this.props.productAttributes;
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

  static fromPersistenceWithDetails(data: any): Product {
    return new Product({
      id: data.id,
      name: data.name,
      slug: data.slug || '',
      imageUrl: data.images?.[0]?.url || null,
      minPrice: data.variants?.[0]?.price ? Number(data.variants[0].price) : Number(data.basePrice),
      isNew: data.isNew ?? false,
      isSale: data.isSale ?? false,
      description: data.description,
      basePrice: Number(data.basePrice),
      isDeleted: data.isDeleted,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      variants: data.variants,
      images: data.images,
      categories: data.categories,
      tags: data.tags,
      reviews: data.reviews,
      productAttributes: data.productAttributes,
    });
  }
}
