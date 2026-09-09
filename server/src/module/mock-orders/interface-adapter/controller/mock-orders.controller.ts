import type { OrderTransitionResult } from '../../applications/ports/output/mock-orders.repository';
import type { MarkDeliveredUseCase } from '../../applications/use-cases/mark-delivered.usecase';
import type { MarkReturnPickedUpUseCase } from '../../applications/use-cases/mark-return-picked-up.usecase';
import type { CompleteReturnUseCase } from '../../applications/use-cases/complete-return.usecase';

export class MockOrdersController {
  constructor(
    private readonly markDeliveredUseCase: MarkDeliveredUseCase,
    private readonly markReturnPickedUpUseCase: MarkReturnPickedUpUseCase,
    private readonly completeReturnUseCase: CompleteReturnUseCase,
  ) {}

  markDelivered(orderId: string): Promise<OrderTransitionResult> {
    return this.markDeliveredUseCase.execute(orderId);
  }

  markReturnPickedUp(orderId: string): Promise<OrderTransitionResult> {
    return this.markReturnPickedUpUseCase.execute(orderId);
  }

  completeReturn(orderId: string): Promise<OrderTransitionResult> {
    return this.completeReturnUseCase.execute(orderId);
  }
}
