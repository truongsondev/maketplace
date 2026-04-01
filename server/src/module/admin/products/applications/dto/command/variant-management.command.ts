export interface CreateVariantCommand {
  productId: string;
  sku: string;
  attributes: Record<string, any>;
  price: number;
  stockAvailable: number;
  minStock?: number;
  images?: CreateVariantImageDto[];
}

export interface CreateVariantImageDto {
  url: string;
  altText?: string;
  sortOrder?: number;
  isPrimary?: boolean;
}

export interface CreateVariantResult {
  success: boolean;
  message: string;
  variant: {
    id: string;
    sku: string;
    price: number;
    stockAvailable: number;
  };
}

export interface UpdateVariantCommand {
  variantId: string;
  sku?: string;
  attributes?: Record<string, any>;
  price?: number;
  stockAvailable?: number;
  minStock?: number;
}

export interface UpdateVariantResult {
  success: boolean;
  message: string;
  priceChanged: boolean;
}

export interface DeleteVariantCommand {
  variantId: string;
}

export interface DeleteVariantResult {
  success: boolean;
  message: string;
}

export interface AdjustStockCommand {
  variantId: string;
  action: 'IMPORT' | 'EXPORT' | 'ADJUSTMENT';
  quantity: number;
  referenceId?: string;
  note?: string;
}

export interface AdjustStockResult {
  success: boolean;
  message: string;
  data: {
    variantId: string;
    oldStock: number;
    newStock: number;
    logId: string;
  };
}
