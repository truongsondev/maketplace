export type OrderTab =
  | "all"
  | "pending"
  | "processing"
  | "shipped"
  | "completed"
  | "canceled";

export type OrderSort = "new" | "old";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PAID"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";

export interface OrderListItemProduct {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  imageUrl: string | null;
  attributesText: string;
  quantity: number;
  price: string;
}

export interface MyOrderListItem {
  id: string;
  createdAt: string;
  status: OrderStatus;
  totalPrice: string;
  orderCode: string | null;
  payment: {
    method: string | null;
    status: string | null;
    paidAt: string | null;
    transactionStatus: string | null;
    transactionPaidAt: string | null;
  };
  items: OrderListItemProduct[];
}

export interface MyOrdersListData {
  items: MyOrderListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MyOrdersCountsData {
  all: number;
  pending: number;
  processing: number;
  shipped: number;
  completed: number;
  canceled: number;
}
