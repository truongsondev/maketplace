import { OrdersListClient } from "./orders-list-client";
import { Suspense } from "react";

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="luxury-page px-4 py-16 text-sm text-neutral-500">
          Đang tải...
        </div>
      }
    >
      <OrdersListClient />
    </Suspense>
  );
}
