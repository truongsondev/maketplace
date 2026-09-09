import type {
  AdminRefundDetail,
  AdminRefundSummary,
  ListAdminRefundsCommand,
} from '../../dto/admin-refund.dto';

export interface IAdminRefundRepository {
  listRefunds(params: ListAdminRefundsCommand): Promise<{
    items: AdminRefundSummary[];
    total: number;
    aggregations: {
      pending: number;
      success: number;
      failed: number;
      retrying: number;
    };
  }>;

  getRefundById(refundId: string): Promise<AdminRefundDetail | null>;

  retryRefund(params: { refundId: string; actorAdminId: string }): Promise<AdminRefundDetail>;
}
