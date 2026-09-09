import type {
  AdminVoucherInput,
  AdminVoucherSummary,
} from '../../applications/dto/admin-voucher.dto';
import type {
  ICreateAdminVoucherUseCase,
  IGetAdminVoucherByIdUseCase,
  IListAdminVouchersUseCase,
  ISetAdminVoucherStatusUseCase,
  IUpdateAdminVoucherUseCase,
} from '../../applications/ports/input/admin-voucher.usecase';

export class AdminVoucherController {
  constructor(
    private readonly listUseCase: IListAdminVouchersUseCase,
    private readonly getByIdUseCase: IGetAdminVoucherByIdUseCase,
    private readonly createUseCase: ICreateAdminVoucherUseCase,
    private readonly updateUseCase: IUpdateAdminVoucherUseCase,
    private readonly setStatusUseCase: ISetAdminVoucherStatusUseCase,
  ) {}

  listAdminVouchers(params: {
    page: number;
    limit: number;
    search?: string;
    isActive?: boolean;
  }): Promise<{ items: AdminVoucherSummary[]; total: number }> {
    return this.listUseCase.execute(params);
  }

  getVoucherById(id: string): Promise<AdminVoucherSummary> {
    return this.getByIdUseCase.execute(id);
  }

  createVoucher(input: AdminVoucherInput): Promise<AdminVoucherSummary> {
    return this.createUseCase.execute(input);
  }

  updateVoucher(id: string, input: AdminVoucherInput): Promise<AdminVoucherSummary> {
    return this.updateUseCase.execute(id, input);
  }

  setVoucherStatus(id: string, isActive: boolean): Promise<AdminVoucherSummary> {
    return this.setStatusUseCase.execute(id, isActive);
  }
}
