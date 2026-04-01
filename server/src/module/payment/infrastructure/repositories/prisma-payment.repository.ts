import { PrismaClient } from '@/generated/prisma/client';
import {
  CreatePendingTransactionInput,
  IPaymentRepository,
  PaymentTransactionRecord,
  UpdateTransactionFromIpnInput,
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
        vnpTransactionStatus: true,
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
      vnpTransactionNo: payment.vnpTransactionNo,
      vnpResponseCode: payment.vnpResponseCode,
      vnpTransactionStatus: payment.vnpTransactionStatus,
      paidAt: payment.paidAt,
    };
  }

  async updateFromIpnIfPending(input: UpdateTransactionFromIpnInput): Promise<boolean> {
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

      // Idempotency gate: only update when current status is still PENDING.
      const updateResult = await tx.paymentTransaction.updateMany({
        where: {
          orderCode: input.orderCode,
          status: 'PENDING',
        },
        data: {
          status: input.status,
          bankCode: input.bankCode,
          vnpTransactionNo: input.vnpTransactionNo,
          vnpResponseCode: input.vnpResponseCode,
          vnpTransactionStatus: input.vnpTransactionStatus,
          paidAt: input.paidAt,
          rawPayload: input.rawPayload,
        },
      });

      if (updateResult.count === 0) {
        return false;
      }

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
