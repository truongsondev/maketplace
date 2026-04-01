import { createLogger } from '../../../../shared/util/logger';
import { ParsedVnpParams, VnpIpnResult } from '../dto';
import { IPaymentRepository } from '../ports/output';
import { getVnpayConfig } from '../../infrastructure/vnpay/vnpay.config';
import { parseVnpAmountToVnd, verifyVnpSignature } from '../../infrastructure/vnpay/vnpay.utils';

const logger = createLogger('HandleVnpayIpnUseCase');

function successPayment(query: ParsedVnpParams): boolean {
  return query.vnp_ResponseCode === '00' && query.vnp_TransactionStatus === '00';
}

export class HandleVnpayIpnUseCase {
  constructor(private readonly paymentRepository: IPaymentRepository) {}

  async execute(query: ParsedVnpParams): Promise<VnpIpnResult> {
    const config = getVnpayConfig();

    // Always verify checksum first, before any DB interaction.
    const validSignature = verifyVnpSignature(query, config.hashSecret);
    if (!validSignature) {
      logger.warn('VNPAY IPN signature invalid', {
        orderCode: query.vnp_TxnRef,
      });
      return { RspCode: '97', Message: 'Invalid signature' };
    }

    const orderCode = query.vnp_TxnRef;
    const vnpAmount = parseVnpAmountToVnd(query.vnp_Amount);

    if (!orderCode || vnpAmount === null) {
      return { RspCode: '99', Message: 'Invalid request' };
    }

    const payment = await this.paymentRepository.findByOrderCode(orderCode);
    if (!payment) {
      return { RspCode: '01', Message: 'Order not found' };
    }

    if (payment.status !== 'PENDING') {
      // Idempotency response for repeated callbacks.
      return { RspCode: '02', Message: 'Order already confirmed' };
    }

    if (Number(payment.amount) !== Number(vnpAmount)) {
      logger.warn('VNPAY IPN amount mismatch', {
        orderCode,
        expectedAmount: payment.amount,
        callbackAmount: vnpAmount,
      });
      return { RspCode: '04', Message: 'invalid amount' };
    }

    const nextStatus = successPayment(query) ? 'PAID' : 'FAILED';

    const updated = await this.paymentRepository.updateFromIpnIfPending({
      orderCode,
      status: nextStatus,
      bankCode: query.vnp_BankCode ?? null,
      vnpTransactionNo: query.vnp_TransactionNo ?? null,
      vnpResponseCode: query.vnp_ResponseCode ?? null,
      vnpTransactionStatus: query.vnp_TransactionStatus ?? null,
      paidAt: nextStatus === 'PAID' ? new Date() : null,
      rawPayload: Object.fromEntries(
        Object.entries(query).map(([key, value]) => [key, value ?? '']),
      ),
    });

    if (!updated) {
      return { RspCode: '02', Message: 'Order already confirmed' };
    }

    logger.info('VNPAY IPN processed', {
      orderCode,
      status: nextStatus,
      vnpResponseCode: query.vnp_ResponseCode,
      vnpTransactionStatus: query.vnp_TransactionStatus,
    });

    return { RspCode: '00', Message: 'Confirm Success' };
  }
}
