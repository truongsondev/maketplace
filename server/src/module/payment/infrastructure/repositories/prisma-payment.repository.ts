import { Prisma, PrismaClient } from '@/generated/prisma/client';
import {
  CreatePendingTransactionInput,
  IPaymentRepository,
  PaymentTransactionRecord,
  UpdateTransactionFromWebhookInput,
} from '../../applications/ports/output';

export class PrismaPaymentRepository implements IPaymentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createPendingTransaction(
    input: CreatePendingTransactionInput,
  ): Promise<{ orderId: string }> {
    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId: input.userId,
          totalPrice: input.amount,
          status: 'PENDING',
        },
        select: {
          id: true,
        },
      });

      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: input.amount,
          method: 'PAYOS',
          status: 'PENDING',
        },
      });

      await tx.paymentTransaction.create({
        data: {
          orderId: order.id,
          orderCode: input.orderCode,
          amount: input.amount,
          status: 'PENDING',
        },
      });

      return { orderId: order.id };
    });

    return result;
  }

  async existsByOrderCode(orderCode: string): Promise<boolean> {
    const payment = await this.prisma.paymentTransaction.findUnique({
      where: { orderCode },
      select: { id: true },
    });

    return Boolean(payment);
  }

  async findByOrderCode(orderCode: string): Promise<PaymentTransactionRecord | null> {
    const payment = await this.prisma.paymentTransaction.findUnique({
      where: { orderCode },
      select: {
        orderId: true,
        orderCode: true,
        amount: true,
        status: true,
        bankCode: true,
        vnpTransactionNo: true,
        vnpResponseCode: true,
        paidAt: true,
      },
    });

    if (!payment) {
      return null;
    }

    return {
      orderId: payment.orderId,
      orderCode: payment.orderCode,
      amount: Number(payment.amount),
      status: payment.status,
      bankCode: payment.bankCode,
      gatewayReference: payment.vnpTransactionNo,
      gatewayCode: payment.vnpResponseCode,
      paidAt: payment.paidAt,
    };
  }

  async setCheckoutReference(orderCode: string, paymentLinkId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.paymentTransaction.findUnique({
        where: { orderCode },
        select: { orderId: true },
      });

      if (!existing) {
        return;
      }

      await tx.paymentTransaction.update({
        where: { orderCode },
        data: {
          vnpTransactionNo: paymentLinkId,
        },
      });

      await tx.payment.update({
        where: { orderId: existing.orderId },
        data: {
          transactionId: paymentLinkId,
        },
      });
    });
  }

  async markCreateLinkFailed(orderCode: string, reason: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.paymentTransaction.findUnique({
        where: { orderCode },
        select: { orderId: true, status: true },
      });

      if (!existing || existing.status !== 'PENDING') {
        return;
      }

      await tx.paymentTransaction.update({
        where: { orderCode },
        data: {
          status: 'FAILED',
          vnpResponseCode: 'CREATE_LINK_FAILED',
          rawPayload: { reason },
        },
      });

      await tx.payment.update({
        where: { orderId: existing.orderId },
        data: {
          status: 'FAILED',
        },
      });

      await tx.order.update({
        where: { id: existing.orderId },
        data: {
          status: 'CANCELLED',
        },
      });
    });
  }

  async updateFromWebhookIfPending(input: UpdateTransactionFromWebhookInput): Promise<boolean> {
    const updated = await this.prisma.$transaction(async (tx) => {
      const current = await tx.paymentTransaction.findUnique({
        where: { orderCode: input.orderCode },
        select: {
          orderId: true,
          status: true,
        },
      });

      if (!current || current.status !== 'PENDING') {
        return false;
      }

      const updateResult = await tx.paymentTransaction.updateMany({
        where: {
          orderCode: input.orderCode,
          status: 'PENDING',
        },
        data: {
          status: input.status,
          bankCode: input.bankCode,
          vnpTransactionNo: input.gatewayReference ?? input.paymentLinkId,
          vnpResponseCode: input.gatewayCode,
          vnpTransactionStatus: input.gatewayCode,
          paidAt: input.paidAt,
          rawPayload: input.rawPayload as Prisma.InputJsonValue,
        },
      });

      if (updateResult.count === 0) {
        return false;
      }

      await tx.payment.update({
        where: { orderId: current.orderId },
        data: {
          status: input.status === 'PAID' ? 'SUCCESS' : 'FAILED',
          transactionId: input.paymentLinkId ?? input.gatewayReference,
          paidAt: input.paidAt,
        },
      });

      await tx.order.update({
        where: { id: current.orderId },
        data: {
          status: input.status === 'PAID' ? 'PAID' : 'CANCELLED',
        },
      });

      return true;
    });

    return updated;
  }
}
