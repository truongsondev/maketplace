import type { ReturnFlowStatus } from '@/generated/prisma/enums';

export interface AdminReturnStatusResult {
  orderId: string;
  orderStatus: string;
  returnStatus: ReturnFlowStatus | null;
}

export interface IAdminOrderReturnRepository {
  approveReturns(params: { orderId: string; actorId: string }): Promise<AdminReturnStatusResult>;
  rejectReturns(params: { orderId: string; actorId: string }): Promise<AdminReturnStatusResult>;
  markReturnPickedUp(params: {
    orderId: string;
    actorId: string;
  }): Promise<AdminReturnStatusResult>;
  completeReturn(params: { orderId: string; actorId: string }): Promise<AdminReturnStatusResult>;
}
