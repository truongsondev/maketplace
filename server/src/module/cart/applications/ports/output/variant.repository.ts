export interface IVariantRepository {
  findByIdWithProduct(variantId: string): Promise<VariantWithProduct | null>;
  reserveStock(variantId: string, quantity: number): Promise<void>;
  releaseStock(variantId: string, quantity: number): Promise<void>;
}

export interface VariantWithProduct {
  id: string;
  sku: string;
  attributes: any;
  price: number;
  stockAvailable: number;
  stockOnHand: number;
  stockReserved: number;
  isDeleted: boolean;
  product: {
    id: string;
    name: string;
    isDeleted: boolean;
  };
}
