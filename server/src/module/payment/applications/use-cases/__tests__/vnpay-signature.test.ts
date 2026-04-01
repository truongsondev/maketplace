import { describe, expect, it } from '@jest/globals';
import {
  buildSignedPaymentUrl,
  signVnpParams,
  verifyVnpSignature,
} from '../../../infrastructure/vnpay/vnpay.utils';

describe('VNPAY signature utilities', () => {
  it('should verify signature successfully', () => {
    const secret = 'SECRET_KEY';
    const params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: '2QXUI4J4',
      vnp_Amount: '5000000',
      vnp_TxnRef: '20260322000123',
    };

    const signature = signVnpParams(params, secret);

    const valid = verifyVnpSignature(
      {
        ...params,
        vnp_SecureHash: signature,
      },
      secret,
    );

    expect(valid).toBe(true);
  });

  it('should fail when signature is invalid', () => {
    const secret = 'SECRET_KEY';
    const params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: '2QXUI4J4',
      vnp_Amount: '5000000',
      vnp_TxnRef: '20260322000124',
      vnp_SecureHash: 'invalid-signature',
    };

    const valid = verifyVnpSignature(params, secret);
    expect(valid).toBe(false);
  });

  it('should generate signed payment url with secure hash', () => {
    const secret = 'SECRET_KEY';
    const url = buildSignedPaymentUrl(
      'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
      {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: '2QXUI4J4',
        vnp_Amount: '5000000',
        vnp_TxnRef: '20260322000125',
      },
      secret,
    );

    expect(url).toContain('vnp_SecureHash=');
    expect(url).toContain('vnp_Version=2.1.0');
  });
});
