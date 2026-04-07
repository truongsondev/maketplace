import type {
  ValidateVoucherCommand,
  VoucherSummary,
  VoucherValidationResult,
} from '../../dto/voucher.dto';

export interface IListActiveVouchersUseCase {
  execute(): Promise<VoucherSummary[]>;
}

export interface IValidateVoucherUseCase {
  execute(command: ValidateVoucherCommand): Promise<VoucherValidationResult>;
}
