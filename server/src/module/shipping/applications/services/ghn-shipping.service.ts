import { Prisma, type PrismaClient } from '@/generated/prisma/client';
import { BadRequestError } from '../../../../error-handlling/badRequestError';
import type { CodSettlementService } from '../../../payment/applications/services/cod-settlement.service';
import { createLogger } from '../../../../shared/util/logger';
import { buildGhnPayload } from './ghn-payload-builder.service';
import { mapGhnStatus } from './ghn-status-mapper.service';
import type { GhnConfig } from '../../infrastructure/ghn/ghn.config';
import { GhnClient } from '../../infrastructure/ghn/ghn.client';
import { GhnAddressResolverService } from './ghn-address-resolver.service';

const logger = createLogger('GhnShipping');

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function stringField(data: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) if (typeof data[key] === 'string') return String(data[key]);
  return '';
}

function numberField(data: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = Number(data[key]);
    if (Number.isFinite(value)) return value;
  }
  return undefined;
}

export class GhnShippingService {
  private readonly addressResolver: GhnAddressResolverService;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly client: GhnClient,
    private readonly config: GhnConfig,
    private readonly codSettlement: CodSettlementService,
  ) {
    this.addressResolver = new GhnAddressResolverService(client);
  }

  async createShipment(orderId: string, actorId: string) {
    const existing = await this.prisma.orderShipment.findUnique({ where: { orderId } });
    if (existing) return existing;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { shippingAddress: true, payment: true, items: true },
    });
    if (!order) throw new BadRequestError('Order not found');
    if (order.status !== 'PACKING') throw new BadRequestError('Chỉ có thể bàn giao GHN khi đơn đang đóng gói');
    if (Number(order.shippingFee) !== 0) throw new BadRequestError('Đơn GHN phải giữ chính sách miễn phí giao hàng');

    if (!order.shippingAddress) throw new BadRequestError('Đơn hàng chưa có địa chỉ giao hàng');
    if (!order.shippingAddress.ghnDistrictId || !order.shippingAddress.ghnWardCode) {
      const resolved = await this.addressResolver.resolve(order.shippingAddress);
      await this.prisma.orderShippingAddress.update({
        where: { orderId },
        data: {
          ghnProvinceId: resolved.provinceId,
          ghnDistrictId: resolved.districtId,
          ghnWardCode: resolved.wardCode,
        },
      });
      order.shippingAddress.ghnProvinceId = resolved.provinceId;
      order.shippingAddress.ghnDistrictId = resolved.districtId;
      order.shippingAddress.ghnWardCode = resolved.wardCode;
    }

    const payload = buildGhnPayload(order, this.config);
    let response: Record<string, unknown>;
    if (this.config.previewBeforeCreate) await this.client.preview(payload);
    try {
      response = await this.client.create(payload);
    } catch (error) {
      try {
        response = await this.client.detailByClientCode(orderId);
      } catch {
        throw error;
      }
    }
    const orderCode = stringField(response, 'order_code', 'OrderCode');
    if (!orderCode) throw new BadRequestError('GHN không trả về mã vận đơn');

    try {
      return await this.prisma.$transaction(async tx => {
        const claimed = await tx.order.updateMany({
          where: { id: orderId, status: 'PACKING', shipment: null },
          data: { status: 'SHIPPED', carrierName: 'GHN', trackingCode: orderCode, shippedAt: new Date(), shippingFee: 0 },
        });
        if (claimed.count !== 1) {
          const found = await tx.orderShipment.findUnique({ where: { orderId } });
          if (found) return found;
          throw new BadRequestError('Trạng thái đơn đã thay đổi, vui lòng đồng bộ lại');
        }
        const shipment = await tx.orderShipment.create({
          data: {
            orderId,
            provider: 'GHN',
            providerOrderCode: orderCode,
            providerStatus: stringField(response, 'status') || 'ready_to_pick',
            serviceId: numberField(response, 'service_id'),
            serviceTypeId: this.config.serviceTypeId,
            codAmount: Number((payload as { cod_amount: number }).cod_amount),
            externalFee: numberField(response, 'total_fee', 'fee'),
            rawCreatePayload: json(payload),
            rawCreateResponse: json(response),
          },
        });
        await tx.orderStatusHistory.create({ data: { orderId, oldStatus: 'PACKING', newStatus: 'SHIPPED', changedBy: actorId, reason: `GHN ${orderCode}` } });
        await tx.auditLog.create({ data: { actorType: 'ADMIN', actorId, targetType: 'OrderShipment', targetId: shipment.id, action: 'GHN_SHIPMENT_CREATED', newData: json({ orderCode }) } });
        return shipment;
      });
    } catch (error) {
      const recovered = await this.prisma.orderShipment.findUnique({ where: { orderId } });
      if (recovered) return recovered;
      throw error;
    }
  }

  async applyProviderStatus(orderId: string, status: string, payload: Record<string, unknown>, eventTime?: Date) {
    const shipment = await this.prisma.orderShipment.findUnique({ where: { orderId }, include: { order: true } });
    if (!shipment) return null;
    if (eventTime && shipment.lastWebhookTime && eventTime <= shipment.lastWebhookTime) return shipment;

    const businessStatus = mapGhnStatus(status);
    if (businessStatus === 'DELIVERED' && shipment.order.status === 'SHIPPED') {
      await this.codSettlement.settleOnDelivery(orderId, null, 'SYSTEM');
    }

    return this.prisma.$transaction(async tx => {
      const current = await tx.orderShipment.findUnique({ where: { orderId }, include: { order: true } });
      if (!current) return null;
      if (eventTime && current.lastWebhookTime && eventTime <= current.lastWebhookTime) return current;
      await tx.orderShipment.update({
        where: { orderId },
        data: {
          providerStatus: status,
          externalFee: numberField(payload, 'TotalFee', 'Fee', 'total_fee', 'fee'),
          rawLatestWebhook: json(payload),
          lastWebhookTime: eventTime || new Date(),
        },
      });

      const allowed = businessStatus === 'DELIVERED'
        ? ['SHIPPED'] : businessStatus === 'DELIVERY_FAILED'
          ? ['SHIPPED'] : businessStatus === 'RETURN_TO_STORE'
            ? ['DELIVERY_FAILED'] : [];
      if (!businessStatus || !allowed.includes(current.order.status)) return current;
      const changed = await tx.order.updateMany({
        where: { id: orderId, status: current.order.status },
        data: { status: businessStatus, ...(businessStatus === 'DELIVERED' ? { deliveredAt: new Date() } : {}) },
      });
      if (changed.count === 1) {
        await tx.orderStatusHistory.create({ data: { orderId, oldStatus: current.order.status, newStatus: businessStatus, changedBy: null, reason: `GHN status: ${status}` } });
        await tx.auditLog.create({ data: { actorType: 'SYSTEM', targetType: 'Order', targetId: orderId, action: 'GHN_STATUS_APPLIED', newData: json({ providerStatus: status, orderStatus: businessStatus }) } });
      }
      return tx.orderShipment.findUnique({ where: { orderId } });
    });
  }

  async handleWebhook(payload: Record<string, unknown>) {
    const orderCode = stringField(payload, 'OrderCode', 'order_code');
    const clientOrderCode = stringField(payload, 'ClientOrderCode', 'client_order_code');
    const status = stringField(payload, 'Status', 'status');
    if (!status || (!orderCode && !clientOrderCode)) throw new BadRequestError('Invalid GHN webhook payload');
    const shipment = orderCode
      ? await this.prisma.orderShipment.findUnique({ where: { providerOrderCode: orderCode } })
      : await this.prisma.orderShipment.findUnique({ where: { orderId: clientOrderCode } });
    if (!shipment) {
      logger.warn('GHN webhook shipment not found', { orderCode, clientOrderCode, status });
      return null;
    }
    const rawTime = stringField(payload, 'Time', 'time');
    const parsed = rawTime ? new Date(rawTime) : new Date();
    return this.applyProviderStatus(shipment.orderId, status, payload, Number.isNaN(parsed.getTime()) ? new Date() : parsed);
  }

  async sync(orderId: string) {
    const shipment = await this.requireShipment(orderId);
    const detail = await this.client.detail(shipment.providerOrderCode);
    const status = stringField(detail, 'status');
    return status ? this.applyProviderStatus(orderId, status, detail, new Date()) : shipment;
  }

  async cancel(orderId: string, actorId: string) {
    const shipment = await this.requireShipment(orderId);
    const response = await this.client.cancel(shipment.providerOrderCode);
    const updated = await this.prisma.orderShipment.update({ where: { orderId }, data: { providerStatus: 'cancel', rawLatestWebhook: json(response) } });
    await this.prisma.auditLog.create({ data: { actorType: 'ADMIN', actorId, targetType: 'OrderShipment', targetId: shipment.id, action: 'GHN_SHIPMENT_CANCELLED' } });
    return updated;
  }

  async printToken(orderId: string) {
    const shipment = await this.requireShipment(orderId);
    const data = await this.client.printToken(shipment.providerOrderCode);
    const host = this.config.environment === 'production' ? 'https://online-gateway.ghn.vn' : 'https://dev-online-gateway.ghn.vn';
    return { token: data.token, url: `${host}/a5/public-api/printA5?token=${encodeURIComponent(data.token)}` };
  }

  getForOrder(orderId: string) { return this.prisma.orderShipment.findUnique({ where: { orderId } }); }

  async updateAddressCodes(orderId: string, provinceId: number | null, districtId: number, wardCode: string) {
    return this.prisma.orderShippingAddress.update({ where: { orderId }, data: { ghnProvinceId: provinceId, ghnDistrictId: districtId, ghnWardCode: wardCode } });
  }

  private async requireShipment(orderId: string) {
    const shipment = await this.getForOrder(orderId);
    if (!shipment) throw new BadRequestError('Đơn hàng chưa có vận đơn GHN');
    return shipment;
  }
}
