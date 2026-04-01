import { BadRequestError } from '../../../../error-handlling/badRequestError';
import { createLogger } from '../../../../shared/util/logger';
import { CreatePaymentUrlCommand, CreatePaymentUrlResult } from '../dto';
import { IPaymentRepository } from '../ports/output';
import { buildSignedPaymentUrl, formatVnpDate } from '../../infrastructure/vnpay/vnpay.utils';
import { getVnpayConfig } from '../../infrastructure/vnpay/vnpay.config';

const logger = createLogger('CreateVnpayPaymentUrlUseCase');
const ORDER_INFO_REGEX = /^[A-Za-z0-9 .,_-]{1,255}$/;
const ORDER_TYPE_REGEX = /^[A-Za-z0-9_]{1,100}$/;

export class CreateVnpayPaymentUrlUseCase {
  constructor(private readonly paymentRepository: IPaymentRepository) {}

  async execute(
    command: CreatePaymentUrlCommand,
    requestIp: string,
  ): Promise<CreatePaymentUrlResult> {
    this.validateCommand(command);

    const config = getVnpayConfig();
    const now = new Date();
    const expireAt = new Date(now.getTime() + 15 * 60 * 1000);
    const orderCode = await this.generateUniqueOrderCode(now);

    const createResult = await this.paymentRepository.createPendingTransaction({
      userId: command.userId,
      amount: command.amount,
      orderCode,
    });

    const vnpParams: Record<string, string | undefined> = {
      vnp_Version: config.version,
      vnp_Command: config.command,
      vnp_TmnCode: config.tmnCode,
      vnp_Amount: String(Math.round(command.amount * 100)),
      vnp_CreateDate: formatVnpDate(now),
      vnp_CurrCode: config.currCode,
      vnp_IpAddr: requestIp,
      vnp_Locale: command.locale,
      vnp_OrderInfo: command.orderInfo,
      vnp_OrderType: command.orderType,
      vnp_ReturnUrl: config.returnUrl,
      vnp_ExpireDate: formatVnpDate(expireAt),
      vnp_TxnRef: orderCode,
      vnp_BankCode: command.bankCode,
    };

    const paymentUrl = buildSignedPaymentUrl(config.paymentUrl, vnpParams, config.hashSecret);

    logger.info('Created VNPAY payment URL', {
      orderCode,
      orderId: createResult.orderId,
      amount: command.amount,
    });

    return {
      orderId: createResult.orderId,
      orderCode,
      paymentUrl,
      expiredAt: expireAt.toISOString(),
    };
  }

  private validateCommand(command: CreatePaymentUrlCommand): void {
    if (!Number.isFinite(command.amount) || command.amount <= 0) {
      throw new BadRequestError('amount must be greater than 0');
    }

    if (!ORDER_INFO_REGEX.test(command.orderInfo)) {
      throw new BadRequestError(
        'orderInfo only allows ASCII letters, numbers, spaces and . , _ - characters',
      );
    }

    if (command.locale !== 'vn' && command.locale !== 'en') {
      throw new BadRequestError('locale must be either vn or en');
    }

    if (!ORDER_TYPE_REGEX.test(command.orderType)) {
      throw new BadRequestError('orderType must contain only ASCII letters, numbers or underscore');
    }

    if (command.bankCode && !/^[A-Za-z0-9]{2,20}$/.test(command.bankCode)) {
      throw new BadRequestError('bankCode format is invalid');
    }
  }

  private async generateUniqueOrderCode(now: Date): Promise<string> {
    const datePrefix = formatVnpDate(now).slice(0, 8);

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const randomSuffix = Math.floor(Math.random() * 1_000_000)
        .toString()
        .padStart(6, '0');
      const orderCode = `${datePrefix}${randomSuffix}`;

      const isExists = await this.paymentRepository.existsByOrderCode(orderCode);
      if (!isExists) {
        return orderCode;
      }
    }

    throw new Error('Unable to generate unique order code for VNPAY transaction');
  }
}
