export type GhnBusinessStatus = 'AWAITING_PICKUP' | 'SHIPPED' | 'DELIVERING' | 'DELIVERED' | 'DELIVERY_FAILED' | 'LOST' | 'RETURN_TO_STORE' | null;

export function mapGhnStatus(status: string): GhnBusinessStatus {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'picking') return 'AWAITING_PICKUP';
  if (['ready_to_pick', 'money_collect_picking', 'picked', 'storing', 'transporting', 'sorting'].includes(normalized)) return 'SHIPPED';
  if (normalized === 'delivering') return 'DELIVERING';
  if (normalized === 'delivered') return 'DELIVERED';
  if (normalized === 'delivery_fail') return 'DELIVERY_FAILED';
  if (normalized === 'lost') return 'LOST';
  if (['waiting_to_return', 'return', 'return_transporting', 'return_sorting', 'returning', 'returned'].includes(normalized)) return 'RETURN_TO_STORE';
  return null;
}
