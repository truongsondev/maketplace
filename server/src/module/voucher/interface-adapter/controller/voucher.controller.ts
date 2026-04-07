import type {
  ValidateVoucherCommand,
  VoucherSummary,
  VoucherValidationResult,
} from '../../applications/dto';
import type {
  IListActiveVouchersUseCase,
  IValidateVoucherUseCase,
} from '../../applications/ports/input';

export class VoucherController {
  constructor(
    private readonly listActiveVouchersUseCase: IListActiveVouchersUseCase,
    private readonly validateVoucherUseCase: IValidateVoucherUseCase,
  ) {}

  listActiveVouchers(): Promise<VoucherSummary[]> {
    return this.listActiveVouchersUseCase.execute();
  }

  validateVoucher(command: ValidateVoucherCommand): Promise<VoucherValidationResult> {
    return this.validateVoucherUseCase.execute(command);
  }
}
