export type AdminRefundStatus = "PENDING" | "SUCCESS" | "FAILED" | "RETRYING";
export type AdminRefundType = "CANCEL_REFUND" | "RETURN_REFUND";

export interface AdminRefundItem {
  id: string;
  orderId: string;
  orderStatus: string;
  type: AdminRefundType;
  status: AdminRefundStatus;
  amount: string;
  currency: string;
  provider: string | null;
  providerRefundId: string | null;
  retryCount: number;
  failureReason: string | null;
  requestedAt: string;
  processedAt: string | null;
  initiatedBy: "ADMIN" | "USER" | "SYSTEM";
  user: {
    id: string;
    email: string | null;
    phone: string | null;
  };
  payment: {
    status: string | null;
    method: string | null;
    orderCode: string | null;
  };
}

export interface AdminRefundDetail extends AdminRefundItem {
  idempotencyKey: string;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminRefundListResponse {
  success: boolean;
  data: {
    items: AdminRefundItem[];
    aggregations: {
      pending: number;
      success: number;
      failed: number;
      retrying: number;
    };
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

export interface AdminRefundDetailResponse {
  success: boolean;
  data: AdminRefundDetail;
  message: string;
  timestamp: string;
}
