import { ParsedVnpParams, VnpReturnResult } from '../dto';
import { getVnpayConfig } from '../../infrastructure/vnpay/vnpay.config';
import { parseVnpAmountToVnd, verifyVnpSignature } from '../../infrastructure/vnpay/vnpay.utils';

const RESPONSE_MESSAGES: Record<string, string> = {
  '00': 'Payment successful',
};

export class HandleVnpayReturnUseCase {
  execute(query: ParsedVnpParams): VnpReturnResult {
    const config = getVnpayConfig();
    const isValidSignature = verifyVnpSignature(query, config.hashSecret);

    if (!isValidSignature) {
      return {
        isValidSignature: false,
        message: 'Invalid signature',
      };
    }

    const responseCode = query.vnp_ResponseCode;

    return {
      isValidSignature: true,
      orderCode: query.vnp_TxnRef,
      amount: parseVnpAmountToVnd(query.vnp_Amount) ?? undefined,
      responseCode,
      transactionStatus: query.vnp_TransactionStatus,
      bankCode: query.vnp_BankCode,
      payDate: query.vnp_PayDate,
      message: responseCode
        ? (RESPONSE_MESSAGES[responseCode] ?? 'Payment processed')
        : 'Payment processed',
    };
  }
}
