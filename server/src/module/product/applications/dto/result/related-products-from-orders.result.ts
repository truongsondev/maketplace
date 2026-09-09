export interface RelatedProductItem {
  id: string;
  name: string;
  imageUrl: string | null;
  minPrice: number;
  isNew: boolean;
  isSale: boolean;
}

export interface RelatedProductsFromOrdersResult {
  products: RelatedProductItem[];
}
