export type AdminOrderTab =
  | "all"
  | "pending"
  | "processing"
  | "shipped"
  | "canceled";

export type AdminOrderSort = "new" | "old";

export interface AdminOrderItem {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  imageUrl: string | null;
  attributesText: string;
  quantity: number;
  price: string;
}

export interface AdminOrderListItem {
  id: string;
  createdAt: string;
  status: string;
  returnStatus?: string | null;
  totalPrice: string;
  returns?: {
    requested: number;
    approved: number;
    rejected: number;
    completed: number;
  };
  user: {
    id: string;
    label: string;
    email: string | null;
    phone: string | null;
  };
  payment: {
    method: string | null;
    status: string | null;
    paidAt: string | null;
    transactionStatus: string | null;
    orderCode: string | null;
    transactionPaidAt: string | null;
  };
  items: AdminOrderItem[];
}

export interface AdminOrdersListResponse {
  success: boolean;
  data: {
    items: AdminOrderListItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  message: string;
  timestamp: string;
}

export interface AdminOrdersCountsResponse {
  success: boolean;
  data: {
    all: number;
    pending: number;
    processing: number;
    shipped: number;
    canceled: number;
  };
  message: string;
  timestamp: string;
}
