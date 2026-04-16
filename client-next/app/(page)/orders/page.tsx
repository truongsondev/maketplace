import { OrdersListClient } from "./orders-list-client";
import { Suspense } from "react";

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-10 text-sm text-text-muted">Đang tải...</div>
      }
    >
      <OrdersListClient />
    </Suspense>
  );
}
