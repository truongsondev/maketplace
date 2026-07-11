import type { GhnConfig } from '../../infrastructure/ghn/ghn.config';
import { BadRequestError } from '../../../../error-handlling/badRequestError';

type PayloadOrder = {
  id: string;
  totalPrice: unknown;
  shippingFee: unknown;
  payment: { method: string; status: string } | null;
  shippingAddress: { recipientName: string; phone: string; addressLine: string; ward: string; district: string; city: string; ghnDistrictId: number | null; ghnWardCode: string | null } | null;
  items: Array<{ productName: string; quantity: number; sellingUnitPrice: unknown; price: unknown }>;
};

export function buildGhnPayload(order: PayloadOrder, config: GhnConfig): Record<string, unknown> {
  const address = order.shippingAddress;
  if (!address?.ghnDistrictId || !address.ghnWardCode) throw new BadRequestError('Địa chỉ giao hàng thiếu mã quận/huyện hoặc phường/xã GHN');
  if (!order.items.length) throw new BadRequestError('Đơn hàng không có sản phẩm');
  const codAmount = order.payment?.method === 'COD' ? Number(order.totalPrice) : 0;
  return {
    client_order_code: order.id,
    from_name: config.fromName,
    from_phone: config.fromPhone,
    from_address: config.fromAddress,
    from_ward_code: config.fromWardCode,
    from_district_id: config.fromDistrictId,
    return_phone: config.returnPhone || config.fromPhone,
    return_address: config.returnAddress || config.fromAddress,
    return_ward_code: config.returnWardCode || config.fromWardCode,
    return_district_id: config.returnDistrictId || config.fromDistrictId,
    to_name: address.recipientName,
    to_phone: address.phone,
    to_address: [address.addressLine, address.ward, address.district, address.city].filter(Boolean).join(', '),
    to_ward_code: address.ghnWardCode,
    to_district_id: address.ghnDistrictId,
    cod_amount: codAmount,
    content: `Order ${order.id}`,
    payment_type_id: 1,
    required_note: config.requiredNote,
    service_type_id: config.serviceTypeId,
    insurance_value: Math.max(0, Math.min(Number(order.totalPrice), 5_000_000)),
    weight: config.weight,
    length: config.length,
    width: config.width,
    height: config.height,
    items: order.items.map(item => ({
      name: item.productName,
      quantity: item.quantity,
      price: Number(item.sellingUnitPrice || item.price),
      weight: config.weight,
      length: config.length,
      width: config.width,
      height: config.height,
    })),
  };
}
