export interface ProductImageData {
  productId: string;
  variantId?: string;
  url: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductImageEntity {
  id: string;
  productId: string;
  variantId?: string | null;
  url: string;
  altText?: string | null;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: Date;
}

export interface IProductImageRepository {
  save(data: ProductImageData): Promise<ProductImageEntity>;
  findById(id: string): Promise<ProductImageEntity | null>;
  findByProductId(productId: string): Promise<ProductImageEntity[]>;
  delete(id: string): Promise<void>;
  updatePrimaryStatus(productId: string, imageId: string): Promise<void>;
}
