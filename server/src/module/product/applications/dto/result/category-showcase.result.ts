export interface CategoryShowcaseProductResult {
  id: string;
  name: string;
  imageUrl: string | null;
  minPrice: number;
  isNew: boolean;
  isSale: boolean;
}

export interface CategoryShowcaseResult {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  products: CategoryShowcaseProductResult[];
}
