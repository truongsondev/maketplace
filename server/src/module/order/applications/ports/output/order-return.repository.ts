import type { ReturnFlowStatus } from '@/generated/prisma/enums';

export interface RequestReturnInput {
  userId: string;
  orderId: string;
  reason?: string | null;
}

export interface RequestReturnResult {
  orderId: string;
  orderStatus: string;
  returnStatus: ReturnFlowStatus;
}

export interface IOrderReturnRepository {
  requestReturn(input: RequestReturnInput): Promise<RequestReturnResult>;
}
