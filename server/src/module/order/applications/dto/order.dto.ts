import type { CancelReason, OrderStatus, ReturnFlowStatus } from '@/generated/prisma/enums';

export type OrderTab = 'all' | 'pending' | 'processing' | 'shipped' | 'completed' | 'canceled';
export type OrderSort = 'new' | 'old';

export interface OrderListQuery {
  tab?: OrderTab;
  search?: string | null;
  sort?: OrderSort;
  page: number;
  limit: number;
}

export interface OrderCancelRequestDto {
  id: string;
  status: string;
  reasonCode: CancelReason;
  reasonText: string | null;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  approvedAt: Date | null;
  completedAt: Date | null;
}

export interface OrderRefundDto {
  id: string;
  type: string;
  status: string;
  amount: number;
  requestedAt: Date;
  processedAt: Date | null;
  failureReason: string | null;
}

export interface OrderPaymentDto {
  method: string | null;
  status: string | null;
  paidAt: Date | null;
  transactionStatus: string | null;
  transactionPaidAt: Date | null;
}

export interface OrderItemDto {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  imageUrl: string | null;
  attributesText: string;
  quantity: number;
  price: number;
}

export interface MyOrderDto {
  id: string;
  createdAt: Date;
  status: OrderStatus;
  canceledReason: string | null;
  returnStatus: ReturnFlowStatus | null;
  totalPrice: number;
  orderCode: string | null;
  payment: OrderPaymentDto;
  cancelRequest: OrderCancelRequestDto | null;
  refund: OrderRefundDto | null;
  items: OrderItemDto[];
}

export interface PaginationDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListMyOrdersResult {
  items: MyOrderDto[];
  pagination: PaginationDto;
}

export interface MyOrderCountsResult {
  all: number;
  pending: number;
  processing: number;
  shipped: number;
  completed: number;
  canceled: number;
}

export interface CancelMyOrderResult {
  id: string;
  status: OrderStatus;
}

export interface ConfirmReceivedResult {
  id: string;
  status: OrderStatus;
}

export interface RequestPaidCancelCommand {
  orderId: string;
  reasonCode: CancelReason;
  reasonText: string | null;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
}

export interface RequestPaidCancelResult {
  id: string;
  status: OrderStatus;
  cancelRequestStatus: string;
}
