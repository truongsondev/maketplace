import type { AdminVoucherInput, AdminVoucherSummary } from '../../dto/admin-voucher.dto';

export interface IListAdminVouchersUseCase {
  execute(params: {
    page: number;
    limit: number;
    search?: string;
    isActive?: boolean;
  }): Promise<{ items: AdminVoucherSummary[]; total: number }>;
}

export interface IGetAdminVoucherByIdUseCase {
  execute(id: string): Promise<AdminVoucherSummary>;
}

export interface ICreateAdminVoucherUseCase {
  execute(input: AdminVoucherInput): Promise<AdminVoucherSummary>;
}

export interface IUpdateAdminVoucherUseCase {
  execute(id: string, input: AdminVoucherInput): Promise<AdminVoucherSummary>;
}

export interface ISetAdminVoucherStatusUseCase {
  execute(id: string, isActive: boolean): Promise<AdminVoucherSummary>;
}
