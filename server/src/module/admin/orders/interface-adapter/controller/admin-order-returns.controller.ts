import type { AdminReturnStatusResult } from '../../applications/ports/output/admin-order-return.repository';
import type { ApproveReturnsUseCase } from '../../applications/use-cases/approve-returns.usecase';
import type { RejectReturnsUseCase } from '../../applications/use-cases/reject-returns.usecase';
import type { MarkReturnPickedUpUseCase } from '../../applications/use-cases/mark-return-picked.usecase';
import type { CompleteReturnUseCase } from '../../applications/use-cases/complete-return.usecase';

export class AdminOrderReturnsController {
  constructor(
    private readonly approveReturnsUseCase: ApproveReturnsUseCase,
    private readonly rejectReturnsUseCase: RejectReturnsUseCase,
    private readonly markReturnPickedUpUseCase: MarkReturnPickedUpUseCase,
    private readonly completeReturnUseCase: CompleteReturnUseCase,
  ) {}

  approve(orderId: string, actorId?: string): Promise<AdminReturnStatusResult> {
    return this.approveReturnsUseCase.execute({ orderId, actorId });
  }

  reject(orderId: string, actorId?: string): Promise<AdminReturnStatusResult> {
    return this.rejectReturnsUseCase.execute({ orderId, actorId });
  }

  pickedUp(orderId: string, actorId?: string): Promise<AdminReturnStatusResult> {
    return this.markReturnPickedUpUseCase.execute({ orderId, actorId });
  }

  complete(orderId: string, actorId?: string): Promise<AdminReturnStatusResult> {
    return this.completeReturnUseCase.execute({ orderId, actorId });
  }
}
