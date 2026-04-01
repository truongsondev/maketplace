import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CreateVnpayPaymentRequest,
  paymentService,
} from "@/services/payment.service";
import type { ApiErrorResponse } from "@/types/api.types";

export function useCreateVnpayPaymentUrl() {
  return useMutation({
    mutationFn: (payload: CreateVnpayPaymentRequest) =>
      paymentService.createVnpayPaymentUrl(payload),
    onError: (err: ApiErrorResponse) => {
      toast.error("Không thể khởi tạo thanh toán VNPAY", {
        description: err?.error?.message ?? "Vui lòng thử lại sau.",
      });
    },
  });
}
