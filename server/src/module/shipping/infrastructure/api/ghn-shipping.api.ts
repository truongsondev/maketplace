import express, { type Request, type Response } from 'express';
import type { PrismaClient } from '@/generated/prisma/client';
import { BadRequestError } from '../../../../error-handlling/badRequestError';
import { ForbiddenError } from '../../../../error-handlling/forbiddenError';
import { ResponseFormatter } from '../../../../shared/server/api-response';
import { asyncHandler } from '../../../../shared/server/error-middleware';
import type { GhnConfig } from '../ghn/ghn.config';
import type { GhnClient } from '../ghn/ghn.client';
import type { GhnShippingService } from '../../applications/services/ghn-shipping.service';

const cache = new Map<string, { expiresAt: number; value: unknown }>();
const CACHE_TTL = 6 * 60 * 60 * 1000;

async function cached(key: string, loader: () => Promise<unknown>) {
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value;
  const value = await loader();
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL });
  return value;
}

function positiveInt(value: unknown, name: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new BadRequestError(`${name} must be a positive integer`);
  return parsed;
}

export function createGhnMasterDataRouter(client: GhnClient) {
  const router = express.Router();
  router.get('/provinces', asyncHandler(async (_req, res) => {
    res.json(ResponseFormatter.success(await cached('provinces', () => client.provinces())));
  }));
  router.get('/districts', asyncHandler(async (req, res) => {
    const provinceId = positiveInt(req.query.provinceId, 'provinceId');
    res.json(ResponseFormatter.success(await cached(`districts:${provinceId}`, () => client.districts(provinceId))));
  }));
  router.get('/wards', asyncHandler(async (req, res) => {
    const districtId = positiveInt(req.query.districtId, 'districtId');
    res.json(ResponseFormatter.success(await cached(`wards:${districtId}`, () => client.wards(districtId))));
  }));
  return router;
}

export function createGhnWebhookRouter(service: GhnShippingService, config: GhnConfig) {
  const router = express.Router();
  router.post('/order-status', asyncHandler(async (req: Request, res: Response) => {
    if (config.webhookSecret) {
      const supplied = String(req.header('x-ghn-webhook-secret') || req.query.secret || '');
      if (supplied !== config.webhookSecret) throw new ForbiddenError('Invalid GHN webhook secret');
    }
    const result = await service.handleWebhook((req.body || {}) as Record<string, unknown>);
    res.status(200).json(ResponseFormatter.success(result, 'GHN webhook accepted'));
  }));
  return router;
}

export function createGhnAdminRouter(service: GhnShippingService) {
  const router = express.Router();
  router.post('/shipments/ghn/sync', asyncHandler(async (_req, res) => {
    res.json(ResponseFormatter.success(await service.syncAllPending(), 'Đã đồng bộ các đơn GHN'));
  }));
  router.post('/:orderId/return-shipment/ghn', asyncHandler(async (req, res) => {
    if (!req.userId) throw new ForbiddenError('Authentication required');
    res.json(ResponseFormatter.success(await service.createReturnShipment(String(req.params.orderId), req.userId), 'Đã tạo vận đơn hoàn GHN'));
  }));
  router.post('/:orderId/return-shipment/sync', asyncHandler(async (req, res) => {
    res.json(ResponseFormatter.success(await service.syncReturnShipment(String(req.params.orderId)), 'Đã đồng bộ vận đơn hoàn GHN'));
  }));
  router.post('/:orderId/return-shipment/print-token', asyncHandler(async (req, res) => {
    res.json(ResponseFormatter.success(await service.printReturnToken(String(req.params.orderId))));
  }));
  router.post('/:orderId/ship/ghn', asyncHandler(async (req, res) => {
    if (!req.userId) throw new ForbiddenError('Authentication required');
    const result = await service.createShipment(String(req.params.orderId), req.userId);
    res.status(200).json(ResponseFormatter.success(result, 'Đã tạo vận đơn GHN'));
  }));
  router.post('/:orderId/shipment/sync', asyncHandler(async (req, res) => {
    res.json(ResponseFormatter.success(await service.sync(String(req.params.orderId)), 'Đã đồng bộ GHN'));
  }));
  router.post('/:orderId/shipment/cancel', asyncHandler(async (req, res) => {
    if (!req.userId) throw new ForbiddenError('Authentication required');
    res.json(ResponseFormatter.success(await service.cancel(String(req.params.orderId), req.userId), 'Đã hủy vận đơn GHN'));
  }));
  router.post('/:orderId/shipment/print-token', asyncHandler(async (req, res) => {
    res.json(ResponseFormatter.success(await service.printToken(String(req.params.orderId))));
  }));
  router.patch('/:orderId/shipment/address-codes', asyncHandler(async (req, res) => {
    const body = (req.body || {}) as Record<string, unknown>;
    const provinceId = body.ghnProvinceId == null ? null : positiveInt(body.ghnProvinceId, 'ghnProvinceId');
    const districtId = positiveInt(body.ghnDistrictId, 'ghnDistrictId');
    const wardCode = String(body.ghnWardCode || '').trim();
    if (!wardCode) throw new BadRequestError('ghnWardCode is required');
    res.json(ResponseFormatter.success(await service.updateAddressCodes(String(req.params.orderId), provinceId, districtId, wardCode)));
  }));
  return router;
}

export function createGhnCustomerRouter(service: GhnShippingService, prisma: PrismaClient) {
  const router = express.Router();
  router.get('/:orderId/shipment', asyncHandler(async (req, res) => {
    if (!req.userId) throw new ForbiddenError('Authentication required');
    const orderId = String(req.params.orderId);
    const owned = await prisma.order.findFirst({ where: { id: orderId, userId: req.userId }, select: { id: true } });
    if (!owned) throw new ForbiddenError('Order not found or access denied');
    res.json(ResponseFormatter.success(await service.getForOrder(orderId)));
  }));
  return router;
}
