import {
  CreatePayosPaymentLinkCommand,
  CreatePayosPaymentLinkResult,
  CreateCodOrderCommand,
  CreateCodOrderResult,
  HandlePayosWebhookResult,
  PaymentStatusResult,
  PayosReturnResult,
} from '../../applications/dto';
import {
  ICreatePayosPaymentLinkUseCase,
  ICreateCodOrderUseCase,
  IGetPaymentStatusUseCase,
  IHandlePayosReturnUseCase,
  IHandlePayosWebhookUseCase,
} from '../../applications/ports/input';

export class PaymentController {
  constructor(
    private readonly createPayosPaymentLinkUseCase: ICreatePayosPaymentLinkUseCase,
    private readonly handlePayosReturnUseCase: IHandlePayosReturnUseCase,
    private readonly handlePayosWebhookUseCase: IHandlePayosWebhookUseCase,
    private readonly getPaymentStatusUseCase: IGetPaymentStatusUseCase,
    private readonly createCodOrderUseCase: ICreateCodOrderUseCase,
  ) {}

  createPayosPaymentLink(
    command: CreatePayosPaymentLinkCommand,
  ): Promise<CreatePayosPaymentLinkResult> {
    return this.createPayosPaymentLinkUseCase.execute(command);
  }

  handlePayosReturn(orderCode: string): Promise<PayosReturnResult> {
    return this.handlePayosReturnUseCase.execute(orderCode);
  }

  handlePayosWebhook(payload: unknown): Promise<HandlePayosWebhookResult> {
    return this.handlePayosWebhookUseCase.execute(payload);
  }

  getPaymentStatus(orderCode: string, userId: string): Promise<PaymentStatusResult> {
    return this.getPaymentStatusUseCase.execute(orderCode, userId);
  }

  createCodOrder(command: CreateCodOrderCommand): Promise<CreateCodOrderResult> {
    return this.createCodOrderUseCase.execute(command);
  }
}
