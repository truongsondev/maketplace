import type {
  CancelMyOrderResult,
  ConfirmReceivedResult,
  ListMyOrdersResult,
  MyOrderCountsResult,
  MyOrderDto,
  OrderListQuery,
  RequestPaidCancelCommand,
  RequestPaidCancelResult,
} from '../../dto/order.dto';

export interface IOrderRepository {
  listMyOrders(input: { userId: string } & OrderListQuery): Promise<ListMyOrdersResult>;
  getMyCounts(userId: string): Promise<MyOrderCountsResult>;
  getMyOrderDetail(input: { userId: string; orderId: string }): Promise<MyOrderDto>;

  cancelMyOrder(input: { userId: string; orderId: string }): Promise<CancelMyOrderResult>;
  confirmReceived(input: { userId: string; orderId: string }): Promise<ConfirmReceivedResult>;
  requestPaidCancel(
    input: { userId: string } & RequestPaidCancelCommand,
  ): Promise<RequestPaidCancelResult>;
}
