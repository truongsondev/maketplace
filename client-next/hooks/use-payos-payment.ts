import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CreatePayosPaymentLinkRequest,
  payosPaymentService,
} from "@/services/payos-payment.service";
import type { ApiErrorResponse } from "@/types/api.types";

export function useCreatePayosPaymentLink() {
  return useMutation({
    mutationFn: (payload: CreatePayosPaymentLinkRequest) =>
      payosPaymentService.createPaymentLink(payload),
    onError: (err: ApiErrorResponse) => {
      toast.error("Khong the khoi tao thanh toan PayOS", {
        description: err?.error?.message ?? "Vui long thu lai sau.",
      });
    },
  });
}
