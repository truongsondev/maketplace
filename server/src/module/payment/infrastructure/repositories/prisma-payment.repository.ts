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
      const cart = await tx.cart.findUnique({
        where: { userId: input.userId },
        select: { id: true },
      });

      if (!cart) {
        throw new Error('Cart not found for checkout');
      }

      const cartItems = await tx.cartItem.findMany({
        where: { cartId: cart.id },
        select: {
          id: true,
          productId: true,
          variantId: true,
          quantity: true,
          variant: {
            select: {
              price: true,
            },
          },
        },
      });

      if (cartItems.length === 0) {
        throw new Error('Cart is empty');
      }

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

      await tx.orderItem.createMany({
        data: cartItems.map((item) => {
          if (!item.variantId || !item.variant) {
            throw new Error(`Cart item ${item.id} missing required variant`);
          }

          return {
            orderId: order.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.variant.price,
          };
        }),
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
          rawPayload: {
            checkout: {
              source: 'cart',
              cartId: cart.id,
              cartItemIds: cartItems.map((i) => i.id),
              items: cartItems.map((i) => ({
                productId: i.productId,
                variantId: i.variantId,
                quantity: i.quantity,
              })),
            },
          } as Prisma.InputJsonValue,
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
        gatewayReference: true,
        gatewayCode: true,
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
      gatewayReference: payment.gatewayReference,
      gatewayCode: payment.gatewayCode,
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
          gatewayReference: paymentLinkId,
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
          gatewayCode: 'CREATE_LINK_FAILED',
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
          rawPayload: true,
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
          gatewayReference: input.gatewayReference ?? input.paymentLinkId,
          gatewayCode: input.gatewayCode,
          gatewayStatus: input.gatewayCode,
          paidAt: input.paidAt,
          rawPayload: this.mergeRawPayload(current.rawPayload, {
            webhook: input.rawPayload,
          }),
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

      if (input.status === 'PAID') {
        await this.consumeStockForPaidOrder(tx, current.orderId);
        await this.removePurchasedCartItems(tx, current.orderId, current.rawPayload);
      }

      return true;
    });

    return updated;
  }

  private mergeRawPayload(
    existing: unknown,
    patch: Record<string, unknown>,
  ): Prisma.InputJsonValue {
    if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
      return {
        ...(existing as Record<string, unknown>),
        ...patch,
      } as Prisma.InputJsonValue;
    }

    return {
      previous: existing,
      ...patch,
    } as Prisma.InputJsonValue;
  }

  private async consumeStockForPaidOrder(
    tx: Prisma.TransactionClient,
    orderId: string,
  ): Promise<void> {
    const items = await tx.orderItem.findMany({
      where: { orderId },
      select: { variantId: true, quantity: true },
    });

    const quantityByVariantId = new Map<string, number>();
    for (const item of items) {
      if (!item.variantId) continue;
      quantityByVariantId.set(
        item.variantId,
        (quantityByVariantId.get(item.variantId) ?? 0) + item.quantity,
      );
    }

    for (const [variantId, quantity] of quantityByVariantId.entries()) {
      const updated = await tx.productVariant.updateMany({
        where: {
          id: variantId,
          stockAvailable: { gte: quantity },
          stockReserved: { gte: quantity },
        },
        data: {
          stockAvailable: { decrement: quantity },
          stockReserved: { decrement: quantity },
        },
      });

      if (updated.count > 0) {
        continue;
      }

      const current = await tx.productVariant.findUnique({
        where: { id: variantId },
        select: { stockAvailable: true, stockReserved: true },
      });

      if (!current) {
        continue;
      }

      await tx.productVariant.update({
        where: { id: variantId },
        data: {
          stockAvailable: Math.max(0, current.stockAvailable - quantity),
          stockReserved: Math.max(0, current.stockReserved - quantity),
        },
      });
    }
  }

  private async removePurchasedCartItems(
    tx: Prisma.TransactionClient,
    orderId: string,
    paymentRawPayload: unknown,
  ): Promise<void> {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });

    if (!order) {
      return;
    }

    const raw = paymentRawPayload as any;
    const cartItemIds: unknown = raw?.checkout?.cartItemIds;

    if (!Array.isArray(cartItemIds) || cartItemIds.length === 0) {
      return;
    }

    const ids = cartItemIds.filter((id) => typeof id === 'string') as string[];
    if (ids.length === 0) {
      return;
    }

    await tx.cartItem.deleteMany({
      where: {
        id: { in: ids },
        cart: {
          userId: order.userId,
        },
      },
    });
  }
}
