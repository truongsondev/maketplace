export interface IProductImageRepository {
  findImageForVariant(variantId: string, productId: string): Promise<ProductImageData | null>;
}

export interface ProductImageData {
  url: string;
  altText: string | null;
  isPrimary: boolean;
}
