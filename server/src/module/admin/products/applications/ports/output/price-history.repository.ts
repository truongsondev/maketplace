export interface IPriceHistoryRepository {
  create(data: {
    productId: string;
    variantId?: string;
    oldPrice: number;
    newPrice: number;
    changedBy?: string;
  }): Promise<void>;

  findByProductId(productId: string, variantId?: string): Promise<any[]>;
}
