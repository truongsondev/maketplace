import type { NormalizedAdminVoucherInput, AdminVoucherSummary } from '../../dto/admin-voucher.dto';

export interface IAdminVoucherRepository {
  list(params: {
    page: number;
    limit: number;
    search?: string;
    isActive?: boolean;
  }): Promise<{ items: AdminVoucherSummary[]; total: number }>;
  getById(id: string): Promise<AdminVoucherSummary | null>;
  create(input: NormalizedAdminVoucherInput): Promise<AdminVoucherSummary>;
  update(id: string, input: NormalizedAdminVoucherInput): Promise<AdminVoucherSummary>;
  setStatus(id: string, isActive: boolean): Promise<AdminVoucherSummary>;
}
