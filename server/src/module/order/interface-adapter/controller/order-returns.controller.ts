import type { IRequestReturnUseCase } from '../../applications/ports/input';
import type { RequestReturnResult } from '../../applications/ports/output/order-return.repository';

export class OrderReturnsController {
  constructor(private readonly requestReturnUseCase: IRequestReturnUseCase) {}

  requestReturn(params: {
    userId: string;
    orderId: string;
    reasonCode: string;
    reason?: string | null;
    evidenceImages: Array<{ url: string; publicId?: string | null }>;
    bankAccountName: string;
    bankAccountNumber: string;
    bankName: string;
  }): Promise<RequestReturnResult> {
    return this.requestReturnUseCase.execute({
      userId: params.userId,
      orderId: params.orderId,
      reasonCode: params.reasonCode,
      reason: params.reason ?? null,
      evidenceImages: params.evidenceImages,
      bankAccountName: params.bankAccountName,
      bankAccountNumber: params.bankAccountNumber,
      bankName: params.bankName,
    });
  }
}
