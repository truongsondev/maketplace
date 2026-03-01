export interface CategoryProps {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  productCount: number;
}

export class Category {
  private constructor(private readonly props: CategoryProps) {}

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
  get productCount(): number {
    return this.props.productCount;
  }

  hasProducts(): boolean {
    return this.props.productCount > 0;
  }

  static fromPersistence(props: CategoryProps): Category {
    return new Category(props);
  }
}
