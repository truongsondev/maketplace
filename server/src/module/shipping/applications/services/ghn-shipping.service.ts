import { Prisma, type PrismaClient } from '@/generated/prisma/client';
import { BadRequestError } from '../../../../error-handlling/badRequestError';
import type { CodSettlementService } from '../../../payment/applications/services/cod-settlement.service';
import { createLogger } from '../../../../shared/util/logger';
import { buildGhnPayload } from './ghn-payload-builder.service';
import { mapGhnStatus } from './ghn-status-mapper.service';
import type { GhnConfig } from '../../infrastructure/ghn/ghn.config';
import { GhnClient } from '../../infrastructure/ghn/ghn.client';
import { GhnAddressResolverService } from './ghn-address-resolver.service';
import { awardLoyaltyForOrder } from '../../../user-profile/loyalty.service';

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
          data: { status: 'AWAITING_PICKUP', carrierName: 'GHN', trackingCode: orderCode, shippedAt: new Date(), shippingFee: 0 },
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
        await tx.orderStatusHistory.create({ data: { orderId, oldStatus: 'PACKING', newStatus: 'AWAITING_PICKUP', changedBy: actorId, reason: `GHN ${orderCode}` } });
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
    if (businessStatus === 'DELIVERED' && ['AWAITING_PICKUP', 'SHIPPED', 'DELIVERING', 'DELIVERY_FAILED'].includes(shipment.order.status)) {
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

      const allowed = businessStatus === 'AWAITING_PICKUP'
        ? ['AWAITING_PICKUP'] : businessStatus === 'SHIPPED'
          ? ['AWAITING_PICKUP', 'SHIPPED'] : businessStatus === 'DELIVERING'
            ? ['AWAITING_PICKUP', 'SHIPPED', 'DELIVERING'] : businessStatus === 'DELIVERED'
              ? ['AWAITING_PICKUP', 'SHIPPED', 'DELIVERING', 'DELIVERY_FAILED'] : businessStatus === 'DELIVERY_FAILED'
                ? ['SHIPPED', 'DELIVERING'] : businessStatus === 'RETURN_TO_STORE'
                  ? ['DELIVERY_FAILED'] : [];
      if (!businessStatus || !allowed.includes(current.order.status)) return current;
      const changed = await tx.order.updateMany({
        where: { id: orderId, status: current.order.status },
        data: { status: businessStatus, ...(businessStatus === 'DELIVERED' ? { deliveredAt: new Date() } : {}) },
      });
      if (changed.count === 1) {
        await tx.orderStatusHistory.create({ data: { orderId, oldStatus: current.order.status, newStatus: businessStatus, changedBy: null, reason: `GHN status: ${status}` } });
        await tx.auditLog.create({ data: { actorType: 'SYSTEM', targetType: 'Order', targetId: orderId, action: 'GHN_STATUS_APPLIED', newData: json({ providerStatus: status, orderStatus: businessStatus }) } });
        if (businessStatus === 'DELIVERED') {
          await awardLoyaltyForOrder(tx, orderId);
        }
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
      const returnOrderId = clientOrderCode.startsWith('RT-') ? clientOrderCode.slice(3) : clientOrderCode;
      const returnShipment = orderCode
        ? await this.prisma.returnShipment.findUnique({ where: { providerOrderCode: orderCode } })
        : await this.prisma.returnShipment.findUnique({ where: { orderId: returnOrderId } });
      if (!returnShipment) {
        logger.warn('GHN webhook shipment not found', { orderCode, clientOrderCode, status });
        return null;
      }

      const rawTime = stringField(payload, 'Time', 'time');
      const parsed = rawTime ? new Date(rawTime) : new Date();
      return this.applyReturnProviderStatus(
        returnShipment.orderId,
        status,
        payload,
        Number.isNaN(parsed.getTime()) ? new Date() : parsed,
      );
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

  async syncAllPending() {
    const shipments = await this.prisma.orderShipment.findMany({
      where: {
        provider: 'GHN',
        order: { status: { in: ['AWAITING_PICKUP', 'SHIPPED', 'DELIVERING', 'DELIVERY_FAILED'] } },
      },
      select: { orderId: true },
      orderBy: { updatedAt: 'asc' },
    });

    let succeeded = 0;
    const failed: Array<{ orderId: string; message: string }> = [];
    const batchSize = 5;

    for (let index = 0; index < shipments.length; index += batchSize) {
      const batch = shipments.slice(index, index + batchSize);
      const results = await Promise.allSettled(
        batch.map(({ orderId }) => this.sync(orderId)),
      );
      results.forEach((result, resultIndex) => {
        if (result.status === 'fulfilled') {
          succeeded += 1;
          return;
        }
        const orderId = batch[resultIndex].orderId;
        const message = result.reason instanceof Error ? result.reason.message : 'Unknown GHN sync error';
        failed.push({ orderId, message });
        logger.warn('Bulk GHN sync failed', { orderId, message });
      });
    }

    return {
      total: shipments.length,
      succeeded,
      failed: failed.length,
      failures: failed,
    };
  }

  async createReturnShipment(orderId: string, actorId: string) {
    const existing = await this.prisma.returnShipment.findUnique({ where: { orderId } });
    if (existing) return existing;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        shippingAddress: true,
        items: {
          include: {
            returns: { where: { status: 'RT_APPROVED', requestType: 'RETURN_REFUND' } },
          },
        },
      },
    });
    if (!order) throw new BadRequestError('Order not found');
    if (order.status !== 'DELIVERED' || order.returnStatus !== 'APPROVED') {
      throw new BadRequestError('Chỉ tạo vận đơn hoàn cho đơn đã giao và đã duyệt trả hàng');
    }
    const address = order.shippingAddress;
    if (!address?.ghnDistrictId || !address.ghnWardCode) {
      throw new BadRequestError('Địa chỉ khách hàng thiếu mã quận/huyện hoặc phường/xã GHN');
    }
    const returnItems = order.items.flatMap(item =>
      item.returns.map(row => ({
        returnId: row.id,
        name: item.productName,
        quantity: row.quantity,
        price: Number(item.sellingUnitPrice || item.price),
      })),
    );
    if (!returnItems.length) throw new BadRequestError('Không có sản phẩm RT_APPROVED');

    const clientOrderCode = `RT-${orderId}`;
    const payload = {
      client_order_code: clientOrderCode,
      from_name: address.recipientName,
      from_phone: address.phone,
      from_address: [address.addressLine, address.ward, address.district, address.city].filter(Boolean).join(', '),
      from_ward_code: address.ghnWardCode,
      from_district_id: address.ghnDistrictId,
      return_phone: address.phone,
      return_address: [address.addressLine, address.ward, address.district, address.city].filter(Boolean).join(', '),
      return_ward_code: address.ghnWardCode,
      return_district_id: address.ghnDistrictId,
      to_name: this.config.fromName,
      to_phone: this.config.fromPhone,
      to_address: this.config.fromAddress,
      to_ward_code: this.config.fromWardCode,
      to_district_id: this.config.fromDistrictId,
      cod_amount: 0,
      content: `Return order ${orderId}`,
      payment_type_id: 1,
      required_note: 'KHONGCHOXEMHANG',
      service_type_id: this.config.serviceTypeId,
      insurance_value: 0,
      weight: Math.min(30_000, Math.max(this.config.weight, this.config.weight * returnItems.reduce((sum, item) => sum + item.quantity, 0))),
      length: this.config.length,
      width: this.config.width,
      height: this.config.height,
      items: returnItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        weight: this.config.weight,
        length: this.config.length,
        width: this.config.width,
        height: this.config.height,
      })),
    };

    let response: Record<string, unknown>;
    try {
      response = await this.client.create(payload);
    } catch (error) {
      try {
        response = await this.client.detailByClientCode(clientOrderCode);
      } catch {
        throw error;
      }
    }
    const orderCode = stringField(response, 'order_code', 'OrderCode');
    if (!orderCode) throw new BadRequestError('GHN không trả về mã vận đơn hoàn');

    return this.prisma.$transaction(async tx => {
      const claimed = await tx.order.updateMany({
        where: { id: orderId, status: 'DELIVERED', returnStatus: 'APPROVED', returnShipment: null },
        data: { returnStatus: 'APPROVED' },
      });
      if (claimed.count !== 1) {
        const found = await tx.returnShipment.findUnique({ where: { orderId } });
        if (found) return found;
        throw new BadRequestError('Luồng trả hàng đã thay đổi, vui lòng tải lại');
      }
      await tx.return.updateMany({
        where: { id: { in: returnItems.map(item => item.returnId) }, status: 'RT_APPROVED' },
        data: { status: 'RT_SHIPPING' },
      });
      const shipment = await tx.returnShipment.create({
        data: {
          orderId,
          provider: 'GHN',
          providerOrderCode: orderCode,
          providerStatus: stringField(response, 'status') || 'ready_to_pick',
          externalFee: numberField(response, 'total_fee', 'fee'),
          rawCreatePayload: json(payload),
          rawCreateResponse: json(response),
        },
      });
      await tx.auditLog.create({
        data: { actorType: 'ADMIN', actorId, targetType: 'ReturnShipment', targetId: shipment.id, action: 'GHN_RETURN_SHIPMENT_CREATED', newData: json({ orderCode }) },
      });
      return shipment;
    });
  }

  async syncReturnShipment(orderId: string) {
    const shipment = await this.prisma.returnShipment.findUnique({ where: { orderId } });
    if (!shipment) throw new BadRequestError('Đơn hàng chưa có vận đơn hoàn GHN');
    const detail = await this.client.detail(shipment.providerOrderCode);
    const status = stringField(detail, 'status');
    return this.applyReturnProviderStatus(orderId, status, detail, new Date());
  }

  private async applyReturnProviderStatus(
    orderId: string,
    status: string,
    payload: Record<string, unknown>,
    eventTime: Date,
  ) {
    const shipment = await this.prisma.returnShipment.findUnique({ where: { orderId } });
    if (!shipment) throw new BadRequestError('Đơn hàng chưa có vận đơn hoàn GHN');
    if (shipment.lastSyncedAt && eventTime <= shipment.lastSyncedAt) return shipment;

    const normalized = status.toLowerCase();
    const pickingStatuses = ['picking', 'money_collect_picking'];
    const shippingStatuses = ['picked', 'storing', 'transporting', 'sorting', 'delivering', 'money_collect_delivering'];
    return this.prisma.$transaction(async tx => {
      if (pickingStatuses.includes(normalized)) {
        await tx.order.updateMany({
          where: { id: orderId, returnStatus: { in: ['APPROVED', 'PICKING'] } },
          data: { returnStatus: 'PICKING' },
        });
      } else if (shippingStatuses.includes(normalized) || normalized === 'delivered') {
        await tx.order.updateMany({
          where: { id: orderId, returnStatus: { in: ['APPROVED', 'PICKING', 'SHIPPING'] } },
          data: { returnStatus: 'SHIPPING' },
        });
      }
      return tx.returnShipment.update({
        where: { orderId },
        data: {
          providerStatus: status || shipment.providerStatus,
          externalFee: numberField(payload, 'TotalFee', 'Fee', 'total_fee', 'fee'),
          rawLatestStatus: json(payload),
          lastSyncedAt: eventTime,
          ...(normalized === 'delivered' ? { deliveredAt: eventTime } : {}),
        },
      });
    });
  }

  async printReturnToken(orderId: string) {
    const shipment = await this.prisma.returnShipment.findUnique({ where: { orderId } });
    if (!shipment) throw new BadRequestError('Đơn hàng chưa có vận đơn hoàn GHN');
    const data = await this.client.printToken(shipment.providerOrderCode);
    const host = this.config.environment === 'production' ? 'https://online-gateway.ghn.vn' : 'https://dev-online-gateway.ghn.vn';
    return { token: data.token, url: `${host}/a5/public-api/printA5?token=${encodeURIComponent(data.token)}` };
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
