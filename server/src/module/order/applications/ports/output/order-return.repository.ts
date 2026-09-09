import type { ReturnFlowStatus } from '@/generated/prisma/enums';

export interface RequestReturnInput {
  userId: string;
  orderId: string;
  requestType: 'EXCHANGE' | 'RETURN_REFUND';
  items: Array<{ orderItemId: string; quantity: number; requestedVariantId?: string | null }>;
  reasonCode: string;
  reason?: string | null;
  evidenceImages: Array<{ url: string; publicId?: string | null }>;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  bankName?: string | null;
}

export interface RequestReturnResult {
  orderId: string;
  orderStatus: string;
  returnStatus: ReturnFlowStatus;
}

export interface IOrderReturnRepository {
  requestReturn(input: RequestReturnInput): Promise<RequestReturnResult>;
}
