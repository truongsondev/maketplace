import type { ActorType, RefundStatus, RefundType } from '@/generated/prisma/enums';

export interface ListAdminRefundsCommand {
  page: number;
  limit: number;
  search?: string;
  status?: RefundStatus;
  type?: RefundType;
  sortBy?: 'requestedAt' | 'processedAt' | 'amount';
  sortOrder?: 'asc' | 'desc';
  from?: Date;
  to?: Date;
}

export interface AdminRefundSummary {
  id: string;
  orderId: string;
  orderStatus: string;
  type: RefundType;
  status: RefundStatus;
  amount: string;
  currency: string;
  provider: string | null;
  providerRefundId: string | null;
  retryCount: number;
  failureReason: string | null;
  requestedAt: Date;
  processedAt: Date | null;
  initiatedBy: ActorType;
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

export interface AdminRefundDetail extends AdminRefundSummary {
  idempotencyKey: string;
  reason: string | null;
  createdAt: Date;
  updatedAt: Date;
}
