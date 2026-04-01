"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  XCircle,
} from "lucide-react";
import {
  paymentService,
  type PaymentOrderStatus,
  type VnpayReturnVerification,
} from "@/services/payment.service";

type ReturnViewState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | {
      kind: "ready";
      verifyResult: VnpayReturnVerification;
      orderStatus: PaymentOrderStatus | null;
    };

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

export default function VnpayReturnPage() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<ReturnViewState>({ kind: "loading" });

  const query = useMemo(
    () => new URLSearchParams(searchParams.toString()),
    [searchParams],
  );

  useEffect(() => {
    let cancelled = false;

    async function run(): Promise<void> {
      try {
        const verifyResult = await paymentService.verifyVnpayReturn(query);

        let orderStatus: PaymentOrderStatus | null = null;
        if (verifyResult.orderCode) {
          orderStatus = await paymentService.getPaymentStatus(
            verifyResult.orderCode,
          );
        }

        if (!cancelled) {
          setState({ kind: "ready", verifyResult, orderStatus });
        }
      } catch {
        if (!cancelled) {
          setState({
            kind: "error",
            message: "Không thể lấy trạng thái thanh toán. Vui lòng thử lại.",
          });
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [query]);

  if (state.kind === "loading") {
    return (
      <main className="mx-auto max-w-3xl px-4 py-14">
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <Loader2 className="mx-auto size-8 animate-spin text-primary" />
          <p className="mt-4 text-slate-600">
            Đang kiểm tra kết quả thanh toán...
          </p>
        </div>
      </main>
    );
  }

  if (state.kind === "error") {
    return (
      <main className="mx-auto max-w-3xl px-4 py-14">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto size-8 text-red-500" />
          <p className="mt-3 font-semibold text-red-600">Có lỗi xảy ra</p>
          <p className="mt-2 text-red-500">{state.message}</p>
          <Link
            href="/"
            className="mt-5 inline-flex h-10 items-center rounded-lg bg-primary px-5 font-semibold text-white"
          >
            Về trang chủ
          </Link>
        </div>
      </main>
    );
  }

  const isPaidFromDb = state.orderStatus?.status === "PAID";
  const isFailedFromDb = state.orderStatus?.status === "FAILED";
  const isPendingFromDb = state.orderStatus?.status === "PENDING";

  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Kết quả thanh toán VNPAY
        </h1>

        <div className="mt-6 rounded-xl border border-slate-200 p-5">
          {!state.verifyResult.isValidSignature && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              <XCircle className="mt-0.5 size-5" />
              <div>
                <p className="font-semibold">Chữ ký không hợp lệ</p>
                <p className="text-sm">
                  Dữ liệu trả về không hợp lệ. Vui lòng liên hệ bộ phận hỗ trợ.
                </p>
              </div>
            </div>
          )}

          {state.verifyResult.isValidSignature && isPaidFromDb && (
            <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
              <CheckCircle2 className="mt-0.5 size-5" />
              <div>
                <p className="font-semibold">Thanh toán thành công</p>
                <p className="text-sm">
                  Đơn hàng đã được xác nhận thanh toán qua IPN.
                </p>
              </div>
            </div>
          )}

          {state.verifyResult.isValidSignature && isFailedFromDb && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              <XCircle className="mt-0.5 size-5" />
              <div>
                <p className="font-semibold">Thanh toán thất bại</p>
                <p className="text-sm">
                  Hệ thống đã ghi nhận giao dịch không thành công.
                </p>
              </div>
            </div>
          )}

          {state.verifyResult.isValidSignature && isPendingFromDb && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-700">
              <Clock3 className="mt-0.5 size-5" />
              <div>
                <p className="font-semibold">Đang chờ xác nhận</p>
                <p className="text-sm">
                  Hệ thống đang đợi callback IPN từ VNPAY để chốt trạng thái.
                </p>
              </div>
            </div>
          )}

          <div className="mt-5 space-y-2 text-sm text-slate-600">
            <p>
              <span className="font-semibold text-slate-900">
                Mã giao dịch:
              </span>{" "}
              {state.verifyResult.orderCode ?? "-"}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Số tiền:</span>{" "}
              {typeof state.orderStatus?.amount === "number"
                ? formatPrice(state.orderStatus.amount)
                : typeof state.verifyResult.amount === "number"
                  ? formatPrice(state.verifyResult.amount)
                  : "-"}
            </p>
            <p>
              <span className="font-semibold text-slate-900">
                Trạng thái DB:
              </span>{" "}
              {state.orderStatus?.status ?? "-"}
            </p>
            <p>
              <span className="font-semibold text-slate-900">
                Mã phản hồi VNPAY:
              </span>{" "}
              {state.orderStatus?.vnpResponseCode ??
                state.verifyResult.responseCode ??
                "-"}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-lg bg-primary px-5 font-semibold text-white"
          >
            Tiếp tục mua sắm
          </Link>
          <Link
            href="/cart"
            className="inline-flex h-10 items-center rounded-lg border border-slate-300 px-5 font-semibold text-slate-700"
          >
            Quay lại giỏ hàng
          </Link>
        </div>
      </div>
    </main>
  );
}
