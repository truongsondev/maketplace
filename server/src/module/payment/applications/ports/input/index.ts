import {
  CreatePayosPaymentLinkCommand,
  CreatePayosPaymentLinkResult,
  CreateCodOrderCommand,
  CreateCodOrderResult,
  HandlePayosWebhookResult,
  PaymentStatusResult,
  PayosReturnResult,
} from '../../dto';

export interface ICreatePayosPaymentLinkUseCase {
  execute(command: CreatePayosPaymentLinkCommand): Promise<CreatePayosPaymentLinkResult>;
}

export interface IHandlePayosReturnUseCase {
  execute(orderCode: string): Promise<PayosReturnResult>;
}

export interface IHandlePayosWebhookUseCase {
  execute(payload: unknown): Promise<HandlePayosWebhookResult>;
}

export interface IGetPaymentStatusUseCase {
  execute(orderCode: string, userId: string): Promise<PaymentStatusResult>;
}

export interface ICreateCodOrderUseCase {
  execute(command: CreateCodOrderCommand): Promise<CreateCodOrderResult>;
}
