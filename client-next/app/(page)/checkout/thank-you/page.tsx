import { Suspense } from "react";
import { ThankYouClient } from "./thank-you-client";

function ThankYouFallback() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 dark:border-neutral-700 dark:bg-neutral-900">
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Đang tải thông tin đơn hàng...
        </p>
      </div>
    </main>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<ThankYouFallback />}>
      <ThankYouClient />
    </Suspense>
  );
}
