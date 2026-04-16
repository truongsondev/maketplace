import type { IRequestReturnUseCase } from '../../applications/ports/input';
import type { RequestReturnResult } from '../../applications/ports/output/order-return.repository';

export class OrderReturnsController {
  constructor(private readonly requestReturnUseCase: IRequestReturnUseCase) {}

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
