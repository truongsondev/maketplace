import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { orderService } from "@/services/order.service";
import type { ApiErrorResponse } from "@/types/api.types";
import type {
  CancelReasonCode,
  OrderSort,
  OrderTab,
} from "@/types/order.types";

export const ORDERS_QUERY_KEY = ["orders"] as const;
export const ORDER_COUNTS_QUERY_KEY = ["order-counts"] as const;

function handleOrderError(err: ApiErrorResponse, fallbackTitle: string) {
  const message = err?.error?.message ?? "Đã có lỗi xảy ra. Vui lòng thử lại.";

  if (err?.error?.code === "UNAUTHORIZED") {
    toast.error("Bạn cần đăng nhập", {
      description: "Vui lòng đăng nhập để xem đơn hàng.",
    });
    return;
  }

  toast.error(fallbackTitle, { description: message });
}

export function useMyOrders(
  params: {
    tab?: OrderTab;
    sort?: OrderSort;
    search?: string;
    page?: number;
    limit?: number;
  } = {},
) {
  return useQuery({
    queryKey: [...ORDERS_QUERY_KEY, params],
    queryFn: () => orderService.getMyOrders(params),
  });
}

export function useMyOrderCounts() {
  return useQuery({
    queryKey: ORDER_COUNTS_QUERY_KEY,
    queryFn: () => orderService.getMyOrderCounts(),
  });
}

export function useMyOrderDetail(orderId: string) {
  return useQuery({
    queryKey: [...ORDERS_QUERY_KEY, "detail", orderId],
    queryFn: () => orderService.getMyOrderDetail(orderId),
    enabled: Boolean(orderId),
  });
}

export function useCancelMyOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => orderService.cancelMyOrder(orderId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ORDER_COUNTS_QUERY_KEY }),
      ]);
      toast.success("Đã hủy đơn hàng");
    },
    onError: (err: ApiErrorResponse) => {
      handleOrderError(err, "Hủy đơn thất bại");
    },
  });
}

export function useConfirmReceivedOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => orderService.confirmReceived(orderId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ORDER_COUNTS_QUERY_KEY }),
      ]);
      toast.success("Đã xác nhận nhận hàng");
    },
    onError: (err: ApiErrorResponse) => {
      handleOrderError(err, "Xác nhận nhận hàng thất bại");
    },
  });
}

export function useRequestPaidCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      orderId: string;
      reasonCode: CancelReasonCode;
      reasonText?: string;
      bankAccountName: string;
      bankAccountNumber: string;
      bankName: string;
    }) => orderService.requestPaidCancel(params),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ORDER_COUNTS_QUERY_KEY }),
      ]);
      toast.success("Đã gửi yêu cầu hủy đơn, vui lòng chờ admin duyệt");
    },
    onError: (err: ApiErrorResponse) => {
      handleOrderError(err, "Gửi yêu cầu hủy đơn thất bại");
    },
  });
}

export function useRequestReturnOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { orderId: string; reason?: string }) =>
      orderService.requestReturn(params.orderId, params.reason),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ORDER_COUNTS_QUERY_KEY }),
      ]);
      toast.success("Đã gửi yêu cầu trả hàng/hoàn tiền");
    },
    onError: (err: ApiErrorResponse) => {
      handleOrderError(err, "Gửi yêu cầu trả hàng thất bại");
    },
  });
}
