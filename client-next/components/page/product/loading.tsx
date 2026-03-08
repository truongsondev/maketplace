import { Loader2 } from "lucide-react";

export function Loading() {
  return (
    <main className="grow w-full max-w-360 mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-center min-h-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-12 text-primary animate-spin" />
          <p className="text-slate-600 dark:text-slate-400">
            Đang tải sản phẩm...
          </p>
        </div>
      </div>
    </main>
  );
}
