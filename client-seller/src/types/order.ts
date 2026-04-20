export type AdminOrderTab =
  | "all"
  | "pending"
  | "processing"
  | "shipped"
  | "completed"
  | "canceled";

export type AdminOrderSort = "new" | "old";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PAID"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";

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
  cancelRequest?: {
    id: string;
    status: "REQUESTED" | "APPROVED" | "REJECTED" | "COMPLETED";
    reasonCode:
      | "NO_LONGER_NEEDED"
      | "BUY_OTHER_ITEM"
      | "FOUND_CHEAPER"
      | "OTHER";
    reasonText: string | null;
    bankAccountName: string;
    bankAccountNumber: string;
    bankName: string;
    rejectionReason: string | null;
    approvedAt: string | null;
    completedAt: string | null;
  } | null;
  cancelRefund?: {
    id: string;
    status: "PENDING" | "SUCCESS" | "FAILED" | "RETRYING";
    amount: string;
    failureReason: string | null;
    requestedAt: string;
    processedAt: string | null;
  } | null;
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
  shipping?: {
    addressId: string | null;
    recipient: string;
    phone: string | null;
    addressLine: string | null;
    ward: string | null;
    district: string | null;
    city: string | null;
    source: "LATEST_USER_ADDRESS" | "USER_PROFILE_FALLBACK";
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
    completed: number;
    canceled: number;
  };
  message: string;
  timestamp: string;
}

export interface AdminOrderStatusBreakdown {
  from: string;
  to: string;
  days: number;
  total: number;
  counts: Record<OrderStatus, number>;
  updatedAt: string;
}

export interface AdminOrderTimeseriesPoint {
  date: string;
  total: number;
}

export interface AdminOrderTimeseries {
  from: string;
  to: string;
  days: number;
  points: AdminOrderTimeseriesPoint[];
  updatedAt: string;
}

export interface AdminOrderStatusBreakdownResponse {
  success: boolean;
  data: AdminOrderStatusBreakdown;
  message: string;
  timestamp: string;
}

export interface AdminOrderTimeseriesResponse {
  success: boolean;
  data: AdminOrderTimeseries;
  message: string;
  timestamp: string;
}

export interface AdminOrderConfirmCheckData {
  orderId: string;
  currentStatus: OrderStatus;
  canConfirm: boolean;
  issues: string[];
  blockingItems: Array<{
    orderItemId: string;
    productId: string;
    productName: string;
    variantId: string | null;
    reasons: string[];
  }>;
}

export interface AdminOrderConfirmCheckResponse {
  success: boolean;
  data: AdminOrderConfirmCheckData;
  message: string;
  timestamp: string;
}
