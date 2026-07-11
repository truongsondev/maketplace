import { buildGhnPayload } from '../ghn-payload-builder.service';
import type { GhnConfig } from '../../../infrastructure/ghn/ghn.config';

const config: GhnConfig = {
  enabled: true,
  environment: 'test',
  baseUrl: 'https://example.test',
  token: 'test',
  shopId: 1,
  fromName: 'Aura',
  fromPhone: '0900000000',
  fromAddress: 'Store',
  fromWardCode: '1A',
  fromDistrictId: 10,
  serviceTypeId: 2,
  requiredNote: 'KHONGCHOXEMHANG',
  weight: 500,
  length: 20,
  width: 15,
  height: 5,
  previewBeforeCreate: false,
  timeoutMs: 1000,
};

function order(method: string) {
  return {
    id: 'order-1',
    totalPrice: 125000,
    shippingFee: 0,
    payment: { method, status: 'PENDING' },
    shippingAddress: {
      recipientName: 'Customer', phone: '0911111111', addressLine: '1 Main',
      ward: 'Ward', district: 'District', city: 'City', ghnDistrictId: 20, ghnWardCode: '2B',
    },
    items: [{ productName: 'Shirt', quantity: 1, sellingUnitPrice: 125000, price: 125000 }],
  };
}

describe('buildGhnPayload', () => {
  it('collects only the discounted total for COD and keeps shop-paid shipping', () => {
    const payload = buildGhnPayload(order('COD'), config);
    expect(payload.cod_amount).toBe(125000);
    expect(payload.payment_type_id).toBe(1);
    expect(payload.weight).toBe(500);
  });

  it('does not collect COD for online payment', () => {
    expect(buildGhnPayload(order('PAYOS'), config).cod_amount).toBe(0);
  });

  it('rejects an address without GHN codes', () => {
    const input = order('COD');
    input.shippingAddress.ghnWardCode = '';
    expect(() => buildGhnPayload(input, config)).toThrow('thiếu mã');
  });
});
