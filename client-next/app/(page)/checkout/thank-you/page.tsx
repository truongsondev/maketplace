import { Suspense } from "react";
import { ThankYouClient } from "./thank-you-client";

function ThankYouFallback() {
  return (
    <main className="luxury-page px-4 pb-16 pt-34 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="luxury-panel p-6 sm:p-8">
          <p className="luxury-copy">Đang tải thông tin đơn hàng...</p>
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
