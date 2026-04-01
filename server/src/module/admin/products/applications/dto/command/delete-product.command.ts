export interface DeleteProductCommand {
  productId: string;
}

export interface DeleteProductResult {
  success: boolean;
  message: string;
}

export interface RestoreProductCommand {
  productId: string;
}

export interface RestoreProductResult {
  success: boolean;
  message: string;
  productId: string;
}

export interface BulkDeleteProductsCommand {
  productIds: string[];
}

export interface BulkDeleteProductsResult {
  success: boolean;
  message: string;
  successCount: number;
  failedCount: number;
  failedIds: string[];
}
