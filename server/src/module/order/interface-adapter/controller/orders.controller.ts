import type {
  ICancelMyOrderUseCase,
  IConfirmReceivedUseCase,
  IGetMyOrderCountsUseCase,
  IGetMyOrderDetailUseCase,
  IListMyOrdersUseCase,
  IRequestPaidCancelUseCase,
} from '../../applications/ports/input';
import type {
  CancelMyOrderResult,
  ConfirmReceivedResult,
  ListMyOrdersResult,
  MyOrderCountsResult,
  MyOrderDto,
  OrderListQuery,
  RequestPaidCancelCommand,
  RequestPaidCancelResult,
} from '../../applications/dto/order.dto';

export class OrdersController {
  constructor(
    private readonly listMyOrdersUseCase: IListMyOrdersUseCase,
    private readonly getMyCountsUseCase: IGetMyOrderCountsUseCase,
    private readonly getMyOrderDetailUseCase: IGetMyOrderDetailUseCase,
    private readonly cancelMyOrderUseCase: ICancelMyOrderUseCase,
    private readonly requestPaidCancelUseCase: IRequestPaidCancelUseCase,
    private readonly confirmReceivedUseCase: IConfirmReceivedUseCase,
  ) {}

  listMyOrders(userId: string, query: OrderListQuery): Promise<ListMyOrdersResult> {
    return this.listMyOrdersUseCase.execute(userId, query);
  }

  getMyCounts(userId: string): Promise<MyOrderCountsResult> {
    return this.getMyCountsUseCase.execute(userId);
  }

  getMyOrderDetail(userId: string, orderId: string): Promise<MyOrderDto> {
    return this.getMyOrderDetailUseCase.execute(userId, orderId);
  }

  cancelMyOrder(userId: string, orderId: string): Promise<CancelMyOrderResult> {
    return this.cancelMyOrderUseCase.execute(userId, orderId);
  }

  requestPaidCancel(
    userId: string,
    command: RequestPaidCancelCommand,
  ): Promise<RequestPaidCancelResult> {
    return this.requestPaidCancelUseCase.execute(userId, command);
  }

  confirmReceived(userId: string, orderId: string): Promise<ConfirmReceivedResult> {
    return this.confirmReceivedUseCase.execute(userId, orderId);
  }
}
