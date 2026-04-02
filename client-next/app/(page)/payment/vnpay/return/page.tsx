import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { VnpayReturnClient } from "./vnpay-return-client";

function VnpayReturnFallback() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <Loader2 className="mx-auto size-8 animate-spin text-primary" />
        <p className="mt-4 text-slate-600">Đang kiểm tra kết quả thanh toán...</p>
      </div>
    </main>
  );
}

export default function VnpayReturnPage() {
  return (
    <Suspense fallback={<VnpayReturnFallback />}>
      <VnpayReturnClient />
    </Suspense>
  );
}
