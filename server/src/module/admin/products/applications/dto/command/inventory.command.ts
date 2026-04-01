export interface GetInventoryLogsCommand {
  page?: number;
  limit?: number;
  variantId?: string;
  productId?: string;
  action?: 'IMPORT' | 'EXPORT' | 'RETURN' | 'ADJUSTMENT';
  startDate?: string;
  endDate?: string;
}

export interface GetInventoryLogsResult {
  items: InventoryLogDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface InventoryLogDto {
  id: string;
  variantId: string;
  variant: {
    sku: string;
    product: {
      id: string;
      name: string;
    };
  };
  action: string;
  quantity: number;
  referenceId?: string;
  createdAt: Date;
}
