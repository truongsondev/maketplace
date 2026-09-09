import { Suspense } from "react";
import { GoogleOAuthCallbackClient } from "@/components/auth/google-oauth-callback-client";

export default function GoogleOAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="grow w-full max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="rounded-sm border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <h1 className="text-lg font-bold text-neutral-900 dark:text-white">
              Đang xác thực Google…
            </h1>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Vui lòng chờ trong giây lát.
            </p>
          </div>
        </main>
      }
    >
      <GoogleOAuthCallbackClient />
    </Suspense>
  );
}
