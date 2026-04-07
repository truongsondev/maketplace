import { BadRequestError } from '../../../../error-handlling/badRequestError';
import { createLogger } from '../../../../shared/util/logger';
import { CreatePayosPaymentLinkCommand, CreatePayosPaymentLinkResult } from '../dto';
import { IPaymentRepository } from '../ports/output';
import { getPayosClient } from '../../infrastructure/payos/payos.client';
import { getPayosConfig } from '../../infrastructure/payos/payos.config';

const logger = createLogger('CreatePayosPaymentLinkUseCase');

export class CreatePayosPaymentLinkUseCase {
  constructor(private readonly paymentRepository: IPaymentRepository) {}

  async execute(command: CreatePayosPaymentLinkCommand): Promise<CreatePayosPaymentLinkResult> {
    this.validateCommand(command);

    const payos = getPayosClient();
    const config = getPayosConfig();
    const orderCode = await this.generateUniqueOrderCode();

    const pendingTransaction = await this.paymentRepository.createPendingTransaction({
      userId: command.userId,
      amount: Math.round(command.amount),
      orderCode,
      voucherCode: command.voucherCode,
      cartItemIds: command.cartItemIds,
    });

    const description = this.buildDescription(orderCode, command.description);

    try {
      const paymentLink = await payos.paymentRequests.create({
        orderCode: Number(orderCode),
        amount: pendingTransaction.payableAmount,
        description,
        returnUrl: config.returnUrl,
        cancelUrl: config.cancelUrl,
      });
      await this.paymentRepository.setCheckoutReference(orderCode, paymentLink.paymentLinkId);

      logger.info('Created PayOS payment link', {
        orderCode,
        orderId: pendingTransaction.orderId,
        amount: pendingTransaction.payableAmount,
        discountAmount: pendingTransaction.discountAmount,
        appliedVoucherCode: pendingTransaction.appliedVoucherCode,
      });

      return {
        orderId: pendingTransaction.orderId,
        orderCode,
        checkoutUrl: paymentLink.checkoutUrl,
        qrCode: paymentLink.qrCode,
        paymentLinkId: paymentLink.paymentLinkId,
        status: paymentLink.status,
        expiredAt: paymentLink.expiredAt,
      };
    } catch (error) {
      await this.paymentRepository.markCreateLinkFailed(
        orderCode,
        error instanceof Error ? error.message : 'Unknown error',
      );
      throw new BadRequestError('Khong the tao link thanh toan PayOS');
    }
  }

  private validateCommand(command: CreatePayosPaymentLinkCommand): void {
    if (!Number.isFinite(command.amount) || command.amount <= 0) {
      throw new BadRequestError('amount must be greater than 0');
    }
  }

  private buildDescription(orderCode: string, customDescription?: string): string {
    const source = customDescription?.trim() || `Thanh toan ${orderCode}`;
    return source.slice(0, 25);
  }

  private async generateUniqueOrderCode(): Promise<string> {
    const now = new Date();
    const datePrefix = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('');

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const randomSuffix = Math.floor(Math.random() * 1_000_000)
        .toString()
        .padStart(6, '0');
      const orderCode = `${datePrefix}${randomSuffix}`;

      const exists = await this.paymentRepository.existsByOrderCode(orderCode);
      if (!exists) {
        return orderCode;
      }
    }

    throw new Error('Unable to generate unique order code for PayOS transaction');
  }
}
