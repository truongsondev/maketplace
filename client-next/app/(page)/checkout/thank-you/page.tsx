import { Suspense } from "react";
import { ThankYouClient } from "./thank-you-client";

function ThankYouFallback() {
  return (
    <main className="px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="rounded-sm border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-black sm:p-8">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Đang tải thông tin đơn hàng...
          </p>
        </div>
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
