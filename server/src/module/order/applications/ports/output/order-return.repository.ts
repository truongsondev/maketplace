import type { ReturnFlowStatus } from '@/generated/prisma/enums';

export interface RequestReturnInput {
  userId: string;
  orderId: string;
  reasonCode: string;
  reason?: string | null;
  evidenceImages: Array<{ url: string; publicId?: string | null }>;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
}

export interface RequestReturnResult {
  orderId: string;
  orderStatus: string;
  returnStatus: ReturnFlowStatus;
}

export interface IOrderReturnRepository {
  requestReturn(input: RequestReturnInput): Promise<RequestReturnResult>;
}
