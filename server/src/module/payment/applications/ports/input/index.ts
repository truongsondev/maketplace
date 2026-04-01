import {
  CreatePaymentUrlCommand,
  CreatePaymentUrlResult,
  ParsedVnpParams,
  PaymentStatusResult,
  VnpIpnResult,
  VnpReturnResult,
} from '../../dto';

export interface ICreatePaymentUrlUseCase {
  execute(command: CreatePaymentUrlCommand, requestIp: string): Promise<CreatePaymentUrlResult>;
}

export interface IHandleVnpReturnUseCase {
  execute(query: ParsedVnpParams): VnpReturnResult;
}

export interface IHandleVnpIpnUseCase {
  execute(query: ParsedVnpParams): Promise<VnpIpnResult>;
}

export interface IGetPaymentStatusUseCase {
  execute(orderCode: string): Promise<PaymentStatusResult>;
}
