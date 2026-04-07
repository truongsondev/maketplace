import type { RequestReturnResult } from '../../applications/ports/output/order-return.repository';
import type { RequestReturnUseCase } from '../../applications/use-cases/request-return.usecase';

export class OrderReturnsController {
  constructor(private readonly requestReturnUseCase: RequestReturnUseCase) {}

  requestReturn(params: {
    userId: string;
    orderId: string;
    reason?: string | null;
  }): Promise<RequestReturnResult> {
    return this.requestReturnUseCase.execute({
      userId: params.userId,
      orderId: params.orderId,
      reason: params.reason ?? null,
    });
  }
}
