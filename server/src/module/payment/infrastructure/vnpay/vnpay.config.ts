import { BadRequestError } from '../../../../error-handlling/badRequestError';

export interface VnpayConfig {
  tmnCode: string;
  hashSecret: string;
  paymentUrl: string;
  returnUrl: string;
  ipnUrl: string;
  version: '2.1.0';
  command: 'pay';
  currCode: 'VND';
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new BadRequestError(`Missing environment variable: ${name}`);
  }
  return value;
}

export function getVnpayConfig(): VnpayConfig {
  return {
    tmnCode: getRequiredEnv('VNPAY_TMN_CODE'),
    hashSecret: getRequiredEnv('VNPAY_HASH_SECRET'),
    paymentUrl:
      process.env.VNPAY_PAYMENT_URL?.trim() || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    returnUrl: getRequiredEnv('VNPAY_RETURN_URL'),
    ipnUrl: getRequiredEnv('VNPAY_IPN_URL'),
    version: '2.1.0',
    command: 'pay',
    currCode: 'VND',
  };
}
