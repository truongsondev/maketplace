import { OrderDetailClient } from "@/app/(page)/orders/order-detail-client";

type PageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function OrderStatusPage(props: PageProps) {
  const { orderId } = await props.params;
  return <OrderDetailClient orderId={orderId} />;
}
