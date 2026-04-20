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

export type ReturnFlowStatus =
  | "REQUESTED"
  | "APPROVED"
  | "WAITING_PICKUP"
  | "SHIPPING"
  | "RETURNING"
  | "COMPLETED"
  | "REJECTED";

export type RefundType = "CANCEL_REFUND" | "RETURN_REFUND";
export type RefundStatus = "PENDING" | "SUCCESS" | "FAILED" | "RETRYING";
export type CancelReasonCode =
  | "NO_LONGER_NEEDED"
  | "BUY_OTHER_ITEM"
  | "FOUND_CHEAPER"
  | "OTHER";
export type CancelRequestStatus =
  | "REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED";

export interface OrderRefundInfo {
  id: string;
  type: RefundType;
  status: RefundStatus;
  amount: string;
  requestedAt: string;
  processedAt: string | null;
  failureReason: string | null;
}

export interface OrderCancelRequestInfo {
  id: string;
  status: CancelRequestStatus;
  reasonCode: CancelReasonCode;
  reasonText: string | null;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  approvedAt: string | null;
  completedAt: string | null;
}

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
  canceledReason: string | null;
  returnStatus?: ReturnFlowStatus | null;
  refund?: OrderRefundInfo | null;
  cancelRequest?: OrderCancelRequestInfo | null;
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
