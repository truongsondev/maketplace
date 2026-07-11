import { Prisma, PrismaClient } from '@/generated/prisma/client';
import { BadRequestError } from '../../../../error-handlling/badRequestError';
import { createLogger } from '../../../../shared/util/logger';
import {
  CreatePendingTransactionInput,
  IPaymentRepository,
  PaymentTransactionRecord,
  UpdateTransactionFromWebhookInput,
} from '../../applications/ports/output';
import { VoucherCheckoutService } from '../../../voucher/applications/services/voucher-checkout.service';
import {
  AdminLowStockNotificationInput,
  AdminLowStockNotificationProcessor,
} from '../../../admin/notifications/infrastructure/services/admin-low-stock-notification.processor';

const logger = createLogger('PrismaPaymentRepository');

export function shouldNotifyLowStock(
  previousStockOnHand: number,
  currentStockOnHand: number,
  minStock: number,
): boolean {
  return previousStockOnHand > minStock && currentStockOnHand <= minStock;
}

export class PrismaPaymentRepository implements IPaymentRepository {
  private readonly lowStockNotificationProcessor: AdminLowStockNotificationProcessor;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly voucherCheckoutService: VoucherCheckoutService,
    lowStockNotificationProcessor?: AdminLowStockNotificationProcessor,
  ) {
    this.lowStockNotificationProcessor =
      lowStockNotificationProcessor ?? new AdminLowStockNotificationProcessor(prisma);
  }

  async createPendingTransaction(input: CreatePendingTransactionInput): Promise<{
    orderId: string;
    payableAmount: number;
    discountAmount: number;
    subtotalAmount: number;
    appliedVoucherCode?: string;
  }> {
    const paymentMethod = input.paymentMethod ?? 'PAYOS';
    if (paymentMethod === 'PAYOS' && !input.orderCode) {
      throw new BadRequestError('orderCode is required for PayOS checkout');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const checkoutPricing = await this.voucherCheckoutService.calculateForCheckout({
        userId: input.userId,
        amount: input.amount,
        voucherCode: input.voucherCode,
        cartItemIds: input.cartItemIds,
        tx,
      });

      const cartItems = await tx.cartItem.findMany({
        where: { cartId: checkoutPricing.cartId, id: { in: checkoutPricing.itemIds } },
        select: {
          id: true,
          productId: true,
          variantId: true,
          quantity: true,
          variant: {
            select: {
              price: true,
              sku: true,
              attributes: true,
              images: { select: { url: true, isPrimary: true, sortOrder: true } },
              product: {
                select: {
                  name: true,
                  basePrice: true,
                  images: { select: { url: true, isPrimary: true, sortOrder: true } },
                },
              },
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
          subtotalPrice: checkoutPricing.subtotalAmount,
          shippingFee: 0,
          totalPrice: checkoutPricing.payableAmount,
          status: 'PENDING',
          discountId: checkoutPricing.appliedVoucherId,
          discountAmount:
            checkoutPricing.discountAmount > 0 ? checkoutPricing.discountAmount : null,
          itemsSubtotal: checkoutPricing.subtotalAmount,
          productDiscount: checkoutPricing.promotionDiscountAmount,
          promotionDiscount: checkoutPricing.promotionDiscountAmount,
          voucherDiscount: checkoutPricing.voucherDiscountAmount,
          grandTotal: checkoutPricing.payableAmount,
          shippingAddress: {
            create: {
              recipientName: input.shipping.recipientName,
              phone: input.shipping.phone,
              addressLine: input.shipping.addressLine,
              ward: input.shipping.ward,
              district: input.shipping.district,
              city: input.shipping.city,
              sourceAddressId: input.shipping.sourceAddressId,
              ghnProvinceId: input.shipping.ghnProvinceId ?? null,
              ghnDistrictId: input.shipping.ghnDistrictId ?? null,
              ghnWardCode: input.shipping.ghnWardCode ?? null,
              snapshotSource: 'CHECKOUT',
            },
          },
        },
        select: {
          id: true,
        },
      });

      await this.reserveStockForCheckout(tx, cartItems, order.id);

      await tx.orderItem.createMany({
        data: cartItems.map((item) => {
          if (!item.variantId || !item.variant) {
            throw new Error(`Cart item ${item.id} missing required variant`);
          }

          const unitPrice = Math.round(Number(item.variant.price));
          const lineSubtotal = unitPrice * item.quantity;
          const allocation = checkoutPricing.itemDiscounts?.find((row) => row.cartItemId === item.id);
          const lineDiscountAmount = allocation?.discountAmount ?? 0;
          const promotionDiscountAmount = allocation?.promotionDiscountAmount ?? 0;
          const voucherDiscountAmount = allocation?.voucherDiscountAmount ?? 0;
          const product = item.variant.product ?? { name: '', basePrice: item.variant.price, images: [] };
          const images = [...(item.variant.images ?? []), ...(product.images ?? [])].sort(
            (a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder,
          );
          const attributes = item.variant.attributes as Prisma.InputJsonValue;

          return {
            orderId: order.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.variant.price,
            productName: product.name,
            productSlug: null,
            sku: item.variant.sku ?? '',
            variantName: Object.values((item.variant.attributes ?? {}) as Record<string, unknown>)
              .filter(Boolean)
              .join(' / ')
              .slice(0, 255) || null,
            variantAttributes: attributes ?? {},
            imageUrl: images[0]?.url ?? null,
            originalUnitPrice: product.basePrice,
            sellingUnitPrice: Math.max(0, unitPrice - Math.floor(promotionDiscountAmount / item.quantity)),
            lineSubtotal,
            lineDiscountAmount,
            promotionDiscountAmount,
            voucherDiscountAmount,
            lineTotal: lineSubtotal - lineDiscountAmount,
            voucherEligible: allocation?.eligible ?? false,
            promotionId: allocation?.promotion?.promotionId ?? null,
            promotionName: allocation?.promotion?.promotionName ?? null,
            promotionSnapshot: allocation?.promotion?.snapshot ?? Prisma.JsonNull,
            snapshotSource: 'CHECKOUT',
          };
        }),
      });

      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: checkoutPricing.payableAmount,
          method: paymentMethod,
          status: 'PENDING',
        },
      });

      if (paymentMethod === 'PAYOS') {
        await tx.paymentTransaction.create({
          data: {
            orderId: order.id,
            orderCode: input.orderCode!,
            amount: checkoutPricing.payableAmount,
            status: 'PENDING',
            rawPayload: {
              checkout: {
                source: 'cart',
                cartId: checkoutPricing.cartId,
                cartItemIds: cartItems.map((i) => i.id),
                subtotalAmount: checkoutPricing.subtotalAmount,
                promotionDiscountAmount: checkoutPricing.promotionDiscountAmount,
                voucherDiscountAmount: checkoutPricing.voucherDiscountAmount,
                loyaltyDiscountAmount: checkoutPricing.loyaltyDiscountAmount,
                loyaltyDiscountPercent: checkoutPricing.loyaltyDiscountPercent,
                loyaltyTier: checkoutPricing.loyaltyTier,
                loyaltyTierLabel: checkoutPricing.loyaltyTierLabel,
                discountAmount: checkoutPricing.discountAmount,
                payableAmount: checkoutPricing.payableAmount,
                voucherCode: checkoutPricing.appliedVoucherCode ?? null,
                items: cartItems.map((i) => ({
                  productId: i.productId,
                  variantId: i.variantId,
                  quantity: i.quantity,
                })),
              },
            } as Prisma.InputJsonValue,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorType: 'USER',
          actorId: input.userId,
          targetType: 'Order',
          targetId: order.id,
          action: 'USER_CHECKOUT_CREATED',
          newData: {
            orderCode: input.orderCode ?? null,
            paymentMethod,
            subtotalAmount: checkoutPricing.subtotalAmount,
            discountAmount: checkoutPricing.discountAmount,
            promotionDiscountAmount: checkoutPricing.promotionDiscountAmount,
            voucherDiscountAmount: checkoutPricing.voucherDiscountAmount,
            loyaltyDiscountAmount: checkoutPricing.loyaltyDiscountAmount,
            loyaltyDiscountPercent: checkoutPricing.loyaltyDiscountPercent,
            loyaltyTier: checkoutPricing.loyaltyTier,
            loyaltyTierLabel: checkoutPricing.loyaltyTierLabel,
            payableAmount: checkoutPricing.payableAmount,
            voucherCode: checkoutPricing.appliedVoucherCode ?? null,
            cartItemIds: cartItems.map((i) => i.id),
          } as Prisma.InputJsonValue,
        },
      });

      if (paymentMethod === 'COD') {
        await tx.cartItem.deleteMany({
          where: {
            cartId: checkoutPricing.cartId,
            id: { in: cartItems.map((item) => item.id) },
          },
        });
      }

      return {
        orderId: order.id,
        payableAmount: checkoutPricing.payableAmount,
        discountAmount: checkoutPricing.discountAmount,
        subtotalAmount: checkoutPricing.subtotalAmount,
        appliedVoucherCode: checkoutPricing.appliedVoucherCode,
      };
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

  async findByOrderCodeForUser(
    orderCode: string,
    userId: string,
  ): Promise<PaymentTransactionRecord | null> {
    const payment = await this.prisma.paymentTransaction.findFirst({
      where: {
        orderCode,
        order: {
          userId,
        },
      },
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
        select: {
          orderId: true,
          status: true,
          order: { select: { userId: true } },
        },
      });

      if (!existing || existing.status !== 'PENDING') {
        return;
      }

      await tx.paymentTransaction.update({
        where: { orderCode },
        data: {
          status: 'FAILED',
          gatewayCode: 'LINK_FAIL',
          rawPayload: { reason },
        },
      });

      await tx.payment.update({
        where: { orderId: existing.orderId },
        data: {
          status: 'FAILED',
        },
      });

      // Payment create-link failed should only cancel an order that is still pending.
      await tx.order.updateMany({
        where: { id: existing.orderId, status: 'PENDING' },
        data: { status: 'CANCELLED' },
      });

      await this.releaseReservedStockForOrder(tx, existing.orderId);

      await tx.auditLog.create({
        data: {
          actorType: 'USER',
          actorId: existing.order.userId,
          targetType: 'Order',
          targetId: existing.orderId,
          action: 'USER_PAYMENT_LINK_FAILED',
          newData: {
            orderCode,
            reason,
          } as Prisma.InputJsonValue,
        },
      });
    });
  }

  async updateFromWebhookIfPending(input: UpdateTransactionFromWebhookInput): Promise<boolean> {
    let lowStockNotifications: AdminLowStockNotificationInput[] = [];

    const updated = await this.prisma.$transaction(async (tx) => {
      const current = await tx.paymentTransaction.findUnique({
        where: { orderCode: input.orderCode },
        select: {
          orderId: true,
          status: true,
          rawPayload: true,
          order: { select: { userId: true } },
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
          status:
            input.status === 'PAID' ? 'PAID' : input.status === 'EXPIRED' ? 'EXPIRED' : 'FAILED',
          transactionId: input.paymentLinkId ?? input.gatewayReference,
          paidAt: input.paidAt,
        },
      });

      // Mapping Payment -> Order (spec):
      // - If payment PAID: only promote PENDING -> PAID (never downgrade higher states)
      // - If payment FAILED/EXPIRED: only cancel when order is still PENDING
      if (input.status === 'PAID') {
        await tx.order.updateMany({
          where: { id: current.orderId, status: 'PENDING' },
          data: { status: 'PAID' },
        });
      } else {
        await tx.order.updateMany({
          where: { id: current.orderId, status: 'PENDING' },
          data: { status: 'CANCELLED' },
        });
      }

      if (input.status === 'PAID') {
        await this.voucherCheckoutService.recordPromotionUsageForPaidOrder?.(tx, current.orderId);
        await this.voucherCheckoutService.recordUsageForPaidOrder(tx, current.orderId);
        lowStockNotifications = await this.consumeStockForPaidOrder(
          tx,
          current.orderId,
          input.orderCode,
        );
        await this.removePurchasedCartItems(tx, current.orderId, current.rawPayload);
      } else {
        await this.releaseReservedStockForOrder(tx, current.orderId);
      }

      await tx.auditLog.create({
        data: {
          actorType: 'USER',
          actorId: current.order.userId,
          targetType: 'Order',
          targetId: current.orderId,
          action:
            input.status === 'PAID'
              ? 'USER_PAYMENT_PAID'
              : input.status === 'EXPIRED'
                ? 'USER_PAYMENT_EXPIRED'
                : 'USER_PAYMENT_FAILED',
          oldData: {
            paymentTransactionStatus: current.status,
          } as Prisma.InputJsonValue,
          newData: {
            paymentTransactionStatus: input.status,
            orderCode: input.orderCode,
            bankCode: input.bankCode ?? null,
            gatewayCode: input.gatewayCode ?? null,
            gatewayReference: input.gatewayReference ?? input.paymentLinkId ?? null,
            paidAt: input.paidAt ?? null,
          } as Prisma.InputJsonValue,
        },
      });

      return true;
    });

    if (updated && lowStockNotifications.length > 0) {
      for (const payload of lowStockNotifications) {
        try {
          await this.lowStockNotificationProcessor.process(payload);
        } catch (error) {
          logger.warn('Failed to process low-stock admin notification', {
            variantId: payload.variantId,
            orderCode: payload.orderCode,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

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
    orderCode: string,
  ): Promise<AdminLowStockNotificationInput[]> {
    const lowStockNotifications: AdminLowStockNotificationInput[] = [];

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
      const current = await tx.productVariant.findUnique({
        where: { id: variantId },
        select: {
          stockOnHand: true,
          stockAvailable: true,
          stockReserved: true,
          minStock: true,
          sku: true,
          product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!current) {
        continue;
      }

      const previousStockOnHand = current.stockOnHand;
      const nextStockOnHand = previousStockOnHand - quantity;

      const updated = await tx.productVariant.updateMany({
        where: {
          id: variantId,
          stockOnHand: { gte: quantity },
          stockReserved: { gte: quantity },
        },
        data: {
          stockOnHand: { decrement: quantity },
          stockReserved: { decrement: quantity },
        },
      });

      if (updated.count === 0) {
        throw new BadRequestError(`Reserved stock is inconsistent for variant ${variantId}`);
      }

      await tx.inventoryLog.create({
        data: {
          variantId,
          action: 'SALE',
          quantity,
          beforeQuantity: previousStockOnHand,
          afterQuantity: nextStockOnHand,
          referenceType: 'ORDER',
          referenceId: orderId,
          reason: 'Consume reserved inventory after online payment',
          salesChannel: 'ONLINE',
        },
      });

      if (shouldNotifyLowStock(previousStockOnHand, nextStockOnHand, current.minStock)) {
        lowStockNotifications.push({
          orderId,
          orderCode,
          productId: current.product.id,
          productName: current.product.name,
          variantId,
          sku: current.sku,
          stockOnHand: nextStockOnHand,
          minStock: current.minStock,
        });
      }
    }

    return lowStockNotifications;
  }

  private async reserveStockForCheckout(
    tx: Prisma.TransactionClient,
    cartItems: Array<{ variantId: string | null; quantity: number }>,
    orderId: string,
  ): Promise<void> {
    const quantityByVariantId = new Map<string, number>();
    for (const item of cartItems) {
      if (!item.variantId) {
        throw new Error('Cart item missing required variant');
      }
      quantityByVariantId.set(
        item.variantId,
        (quantityByVariantId.get(item.variantId) ?? 0) + item.quantity,
      );
    }

    for (const [variantId, quantity] of quantityByVariantId.entries()) {
      const current = await tx.productVariant.findUnique({
        where: { id: variantId },
        select: {
          stockOnHand: true,
          stockAvailable: true,
          stockReserved: true,
          isDeleted: true,
          sku: true,
          product: { select: { isDeleted: true } },
        },
      });

      if (!current || current.isDeleted || current.product.isDeleted) {
        throw new BadRequestError('Sản phẩm không tồn tại hoặc đã bị xóa');
      }

      const availableStock = current.stockOnHand - current.stockReserved;

      if (current.stockAvailable !== availableStock) {
        throw new BadRequestError(`Dữ liệu tồn kho không nhất quán cho SKU ${current.sku}`);
      }

      if (availableStock < quantity) {
        throw new BadRequestError(`Không đủ tồn kho cho SKU ${current.sku}`);
      }

      const reserved = await tx.productVariant.updateMany({
        where: {
          id: variantId,
          stockOnHand: current.stockOnHand,
          stockReserved: current.stockReserved,
          stockAvailable: current.stockAvailable,
        },
        data: {
          stockReserved: { increment: quantity },
          stockAvailable: { decrement: quantity },
        },
      });
      if (reserved.count !== 1) {
        throw new BadRequestError(`Tồn kho vừa thay đổi cho SKU ${current.sku}, vui lòng thử lại`);
      }
      await tx.inventoryLog.create({
        data: {
          variantId,
          action: 'RESERVE',
          quantity,
          beforeQuantity: current.stockOnHand,
          afterQuantity: current.stockOnHand,
          referenceType: 'ORDER',
          referenceId: orderId,
          reason: 'Reserve inventory for online checkout',
          salesChannel: 'ONLINE',
        },
      });
    }
  }

  private async releaseReservedStockForOrder(
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
      const current = await tx.productVariant.findUnique({
        where: { id: variantId },
        select: { stockReserved: true, stockAvailable: true, stockOnHand: true },
      });
      if (!current) continue;
      if (current.stockReserved < quantity) {
        throw new BadRequestError(`Reserved stock is inconsistent for variant ${variantId}`);
      }
      const updated = await tx.productVariant.updateMany({
        where: {
          id: variantId,
          stockOnHand: current.stockOnHand,
          stockReserved: current.stockReserved,
          stockAvailable: current.stockAvailable,
        },
        data: {
          stockReserved: { decrement: quantity },
          stockAvailable: { increment: quantity },
        },
      });

      if (updated.count === 0) {
        throw new BadRequestError(`Inventory changed while releasing variant ${variantId}`);
      }
      await tx.inventoryLog.create({
        data: {
          variantId,
          action: 'RELEASE',
          quantity,
          beforeQuantity: current.stockOnHand,
          afterQuantity: current.stockOnHand,
          referenceType: 'ORDER',
          referenceId: orderId,
          reason: 'Release inventory after payment cancellation or expiration',
          salesChannel: 'ONLINE',
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

    const raw =
      paymentRawPayload && typeof paymentRawPayload === 'object' && !Array.isArray(paymentRawPayload)
        ? (paymentRawPayload as Record<string, unknown>)
        : null;
    const checkout =
      raw?.checkout && typeof raw.checkout === 'object' && !Array.isArray(raw.checkout)
        ? (raw.checkout as Record<string, unknown>)
        : null;
    const cartItemIds = checkout?.cartItemIds;

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
