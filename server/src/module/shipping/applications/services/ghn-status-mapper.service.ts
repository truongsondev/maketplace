export type GhnBusinessStatus = 'DELIVERED' | 'DELIVERY_FAILED' | 'RETURN_TO_STORE' | null;

export function mapGhnStatus(status: string): GhnBusinessStatus {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'delivered') return 'DELIVERED';
  if (normalized === 'delivery_fail') return 'DELIVERY_FAILED';
  if (['waiting_to_return', 'return', 'return_transporting', 'return_sorting', 'returning', 'returned'].includes(normalized)) return 'RETURN_TO_STORE';
  return null;
}
