import {
  CreatePaymentUrlCommand,
  CreatePaymentUrlResult,
  ParsedVnpParams,
  PaymentStatusResult,
  VnpIpnResult,
  VnpReturnResult,
} from '../../applications/dto';
import {
  ICreatePaymentUrlUseCase,
  IGetPaymentStatusUseCase,
  IHandleVnpIpnUseCase,
  IHandleVnpReturnUseCase,
} from '../../applications/ports/input';

export class PaymentController {
  constructor(
    private readonly createPaymentUrlUseCase: ICreatePaymentUrlUseCase,
    private readonly handleVnpReturnUseCase: IHandleVnpReturnUseCase,
    private readonly handleVnpIpnUseCase: IHandleVnpIpnUseCase,
    private readonly getPaymentStatusUseCase: IGetPaymentStatusUseCase,
  ) {}

  createPaymentUrl(
    command: CreatePaymentUrlCommand,
    requestIp: string,
  ): Promise<CreatePaymentUrlResult> {
    return this.createPaymentUrlUseCase.execute(command, requestIp);
  }

  handleVnpReturn(query: ParsedVnpParams): VnpReturnResult {
    return this.handleVnpReturnUseCase.execute(query);
  }

  handleVnpIpn(query: ParsedVnpParams): Promise<VnpIpnResult> {
    return this.handleVnpIpnUseCase.execute(query);
  }

  getPaymentStatus(orderCode: string): Promise<PaymentStatusResult> {
    return this.getPaymentStatusUseCase.execute(orderCode);
  }
}
