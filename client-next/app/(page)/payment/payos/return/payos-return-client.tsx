"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  XCircle,
} from "lucide-react";
import {
  payosPaymentService,
  type PaymentOrderStatus,
  type PayosReturnVerification,
} from "@/services/payos-payment.service";

type ReturnViewState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | {
      kind: "ready";
      verifyResult: PayosReturnVerification;
      orderStatus: PaymentOrderStatus | null;
    };

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

export function PayosReturnClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<ReturnViewState>({ kind: "loading" });

  useEffect(() => {
    if (state.kind !== "ready") return;

    const gatewayStatus = state.verifyResult.gatewayStatus;
    const isPaid =
      gatewayStatus === "PAID" || state.orderStatus?.status === "PAID";
    if (!isPaid) return;

    router.replace(
      `/checkout/thank-you?orderCode=${encodeURIComponent(state.verifyResult.orderCode)}`,
    );
  }, [router, state]);

  useEffect(() => {
    let cancelled = false;

    async function run(): Promise<void> {
      const orderCode =
        searchParams.get("orderCode") || searchParams.get("order_code");

      if (!orderCode) {
        if (!cancelled) {
          setState({
            kind: "error",
            message: "Khong tim thay orderCode tren URL tra ve.",
          });
        }
        return;
      }

      try {
        const verifyResult = await payosPaymentService.verifyReturn(orderCode);
        const orderStatus =
          await payosPaymentService.getPaymentStatus(orderCode);

        if (!cancelled) {
          setState({ kind: "ready", verifyResult, orderStatus });
        }
      } catch {
        if (!cancelled) {
          setState({
            kind: "error",
            message: "Khong the lay trang thai thanh toan. Vui long thu lai.",
          });
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  if (state.kind === "loading") {
    return (
      <main className="mx-auto max-w-3xl px-4 py-14">
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <Loader2 className="mx-auto size-8 animate-spin text-primary" />
          <p className="mt-4 text-slate-600">
            Dang kiem tra ket qua thanh toan...
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
          <p className="mt-3 font-semibold text-red-600">Co loi xay ra</p>
          <p className="mt-2 text-red-500">{state.message}</p>
          <Link
            href="/"
            className="mt-5 inline-flex h-10 items-center rounded-lg bg-primary px-5 font-semibold text-white"
          >
            Ve trang chu
          </Link>
        </div>
      </main>
    );
  }

  const gatewayStatus = state.verifyResult.gatewayStatus;
  const isPaid =
    gatewayStatus === "PAID" || state.orderStatus?.status === "PAID";
  const isFailed =
    gatewayStatus === "FAILED" ||
    gatewayStatus === "CANCELLED" ||
    gatewayStatus === "EXPIRED" ||
    state.orderStatus?.status === "FAILED";
  const isPending = !isPaid && !isFailed;

  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Ket qua thanh toan PayOS
        </h1>

        <div className="mt-6 rounded-xl border border-slate-200 p-5">
          {isPaid && (
            <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
              <CheckCircle2 className="mt-0.5 size-5" />
              <div>
                <p className="font-semibold">Thanh toan thanh cong</p>
                <p className="text-sm">Dang chuyen den trang cam on...</p>
              </div>
            </div>
          )}

          {isFailed && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              <XCircle className="mt-0.5 size-5" />
              <div>
                <p className="font-semibold">Thanh toan that bai</p>
                <p className="text-sm">
                  Giao dich khong thanh cong hoac da bi huy.
                </p>
              </div>
            </div>
          )}

          {isPending && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-700">
              <Clock3 className="mt-0.5 size-5" />
              <div>
                <p className="font-semibold">Dang cho xac nhan</p>
                <p className="text-sm">
                  Vui long cho trong giay lat, hoac tai lai trang.
                </p>
              </div>
            </div>
          )}

          <div className="mt-5 space-y-2 text-sm text-slate-600">
            <p>
              <span className="font-semibold text-slate-900">
                Ma giao dich:
              </span>{" "}
              {state.verifyResult.orderCode}
            </p>
            <p>
              <span className="font-semibold text-slate-900">So tien:</span>{" "}
              {formatPrice(state.verifyResult.amount)}
            </p>
            <p>
              <span className="font-semibold text-slate-900">
                Trang thai gateway:
              </span>{" "}
              {state.verifyResult.gatewayStatus}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-lg bg-primary px-5 font-semibold text-white"
          >
            Tiep tuc mua sam
          </Link>
          <Link
            href="/cart"
            className="inline-flex h-10 items-center rounded-lg border border-slate-300 px-5 font-semibold text-slate-700"
          >
            Quay lai gio hang
          </Link>
        </div>
      </div>
    </main>
  );
}
