export interface GenerateSignatureCommand {
  productId?: string;
}

export interface GenerateSignatureResult {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

export interface SaveProductImageCommand {
  productId: string;
  url: string;
  altText?: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface SaveProductImageResult {
  imageId: string;
  message: string;
}

export interface DeleteProductImageCommand {
  imageId: string;
  publicId: string;
}

export interface DeleteProductImageResult {
  success: boolean;
  message: string;
}
