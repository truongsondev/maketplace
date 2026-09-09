import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function OrderStatusPage(props: PageProps) {
  const { orderId } = await props.params;

  // Use modal-only UX: keep users on /orders and open detail via query.
  redirect(`/orders?orderId=${encodeURIComponent(orderId)}`);
}
