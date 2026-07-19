import express, { Request, Response } from 'express';
import { BadRequestError } from '../../../../error-handlling/badRequestError';
import { ResponseFormatter } from '../../../../shared/server/api-response';
import { asyncHandler } from '../../../../shared/server/error-middleware';
import { createLogger } from '../../../../shared/util/logger';
import { PaymentController } from '../../interface-adapter/controller';
import { getPaymentMethodCapabilities } from '../../payment-method.policy';

const logger = createLogger('PaymentAPI');

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export class PaymentAPI {
  readonly router = express.Router();

  constructor(private readonly paymentController: PaymentController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/methods', this.getPaymentMethods.bind(this));
    this.router.post('/payos/create-link', asyncHandler(this.createPayosPaymentLink.bind(this)));
    this.router.post('/cod/orders', asyncHandler(this.createCodOrder.bind(this)));
    this.router.get('/payos/return', asyncHandler(this.handlePayosReturn.bind(this)));
    this.router.post('/payos/webhook', asyncHandler(this.handlePayosWebhook.bind(this)));
    this.router.get(
      '/payos/orders/:orderCode/status',
      asyncHandler(this.getPaymentStatus.bind(this)),
    );
  }

  private getPaymentMethods(_req: Request, res: Response): void {
    res.status(200).json(ResponseFormatter.success(getPaymentMethodCapabilities()));
  }

  private async createPayosPaymentLink(req: Request, res: Response): Promise<void> {
    const userId = req.userId;
    if (!userId) {
      throw new BadRequestError('User ID not found');
    }

    const { amount, description } = req.body as {
      amount?: number;
      description?: string;
      voucherCode?: string;
      cartItemIds?: string[];
      shipping?: unknown;
    };

    if (typeof amount !== 'number') {
      throw new BadRequestError('amount must be a number');
    }

    if (description && typeof description !== 'string') {
      throw new BadRequestError('description must be a string');
    }

    const voucherCodeValue =
      typeof req.body?.voucherCode === 'string' ? req.body.voucherCode.trim() : undefined;

    const cartItemIdsValue = Array.isArray(req.body?.cartItemIds)
      ? req.body.cartItemIds.filter((id: unknown) => typeof id === 'string' && id.trim().length > 0)
      : undefined;

    const requestBody = req.body as Record<string, unknown>;
    const shippingRaw = requestBody.shipping;
    const shippingValue =
      isRecord(shippingRaw)
        ? {
            recipient: shippingRaw.recipient,
            phone: shippingRaw.phone,
            addressLine: shippingRaw.addressLine,
            ward: shippingRaw.ward,
            // Some clients may only send ward + city; default district to ward.
            district: shippingRaw.district ?? shippingRaw.ward,
            city: shippingRaw.city,
            addressId: shippingRaw.addressId,
            ghnProvinceId: shippingRaw.ghnProvinceId,
            ghnDistrictId: shippingRaw.ghnDistrictId,
            ghnWardCode: shippingRaw.ghnWardCode,
          }
        : undefined;

    if (shippingValue) {
      const fields: Array<keyof typeof shippingValue> = [
        'recipient',
        'phone',
        'addressLine',
        'ward',
        'district',
        'city',
      ];

      for (const field of fields) {
        if (
          typeof shippingValue[field] !== 'string' ||
          String(shippingValue[field]).trim() === ''
        ) {
          throw new BadRequestError(`shipping.${String(field)} is required`);
        }
      }

      if (
        shippingValue.addressId !== undefined &&
        shippingValue.addressId !== null &&
        typeof shippingValue.addressId !== 'string'
      ) {
        throw new BadRequestError('shipping.addressId must be a string');
      }
      if (!Number.isInteger(shippingValue.ghnProvinceId) || Number(shippingValue.ghnProvinceId) <= 0) {
        throw new BadRequestError('shipping.ghnProvinceId must be a positive integer');
      }
      if (!Number.isInteger(shippingValue.ghnDistrictId) || Number(shippingValue.ghnDistrictId) <= 0) {
        throw new BadRequestError('shipping.ghnDistrictId must be a positive integer');
      }
      if (typeof shippingValue.ghnWardCode !== 'string' || !shippingValue.ghnWardCode.trim()) {
        throw new BadRequestError('shipping.ghnWardCode is required');
      }
    }

    const result = await this.paymentController.createPayosPaymentLink({
      userId,
      amount,
      description,
      voucherCode: voucherCodeValue || undefined,
      cartItemIds: cartItemIdsValue,
      shipping: shippingValue
        ? {
            recipient: String(shippingValue.recipient).trim(),
            phone: String(shippingValue.phone).trim(),
            addressLine: String(shippingValue.addressLine).trim(),
            ward: String(shippingValue.ward).trim(),
            district: String(shippingValue.district).trim(),
            city: String(shippingValue.city).trim(),
            ghnProvinceId: Number(shippingValue.ghnProvinceId),
            ghnDistrictId: Number(shippingValue.ghnDistrictId),
            ghnWardCode: String(shippingValue.ghnWardCode).trim(),
            addressId:
              typeof shippingValue.addressId === 'string'
                ? shippingValue.addressId.trim()
                : undefined,
          }
        : undefined,
    });

    res
      .status(201)
      .json(ResponseFormatter.success(result, 'PayOS payment link created successfully'));
  }

  private async handlePayosReturn(req: Request, res: Response): Promise<void> {
    const { orderCode } = req.query;
    if (typeof orderCode !== 'string' || orderCode.trim() === '') {
      throw new BadRequestError('orderCode is required');
    }

    const result = await this.paymentController.handlePayosReturn(orderCode.trim());
    res.status(200).json(ResponseFormatter.success(result));
  }

  private async handlePayosWebhook(req: Request, res: Response): Promise<void> {
    logger.info('PayOS webhook received', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      contentType: req.get('content-type'),
      bodyType: typeof req.body,
      hasBody: Boolean(req.body),
      hasData: isRecord(req.body) && Boolean(req.body.data),
      hasSignature: isRecord(req.body) && Boolean(req.body.signature),
    });

    try {
      const result = await this.paymentController.handlePayosWebhook(req.body);
      res.status(200).json({
        error: 0,
        message: 'Webhook processed',
        data: result,
      });
    } catch (error) {
      logger.warn('PayOS webhook verify failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Keep 200 to avoid repetitive callback retries for malformed signatures.
      res.status(200).json({
        error: -1,
        message: 'Invalid webhook payload',
      });
    }
  }

  private async getPaymentStatus(req: Request, res: Response): Promise<void> {
    const userId = req.userId;
    if (!userId) {
      throw new BadRequestError('User ID not found');
    }

    const { orderCode } = req.params;
    if (!orderCode || typeof orderCode !== 'string') {
      throw new BadRequestError('orderCode is required');
    }

    const result = await this.paymentController.getPaymentStatus(orderCode, userId);
    res.status(200).json(ResponseFormatter.success(result));
  }

  private async createCodOrder(req: Request, res: Response): Promise<void> {
    const userId = req.userId;
    if (!userId) throw new BadRequestError('User ID not found');

    const body = req.body as Record<string, unknown>;
    if (typeof body.amount !== 'number') {
      throw new BadRequestError('amount must be a number');
    }
    if (!isRecord(body.shipping)) {
      throw new BadRequestError('shipping is required');
    }

    const raw = body.shipping;
    const shipping = {
      recipient: raw.recipient,
      phone: raw.phone,
      addressLine: raw.addressLine,
      ward: raw.ward,
      district: raw.district ?? raw.ward,
      city: raw.city,
      addressId: raw.addressId,
      ghnProvinceId: raw.ghnProvinceId,
      ghnDistrictId: raw.ghnDistrictId,
      ghnWardCode: raw.ghnWardCode,
    };
    for (const field of ['recipient', 'phone', 'addressLine', 'ward', 'district', 'city'] as const) {
      if (typeof shipping[field] !== 'string' || !shipping[field].trim()) {
        throw new BadRequestError(`shipping.${field} is required`);
      }
    }
    if (!Number.isInteger(shipping.ghnProvinceId) || Number(shipping.ghnProvinceId) <= 0) {
      throw new BadRequestError('shipping.ghnProvinceId must be a positive integer');
    }
    if (!Number.isInteger(shipping.ghnDistrictId) || Number(shipping.ghnDistrictId) <= 0) {
      throw new BadRequestError('shipping.ghnDistrictId must be a positive integer');
    }
    if (typeof shipping.ghnWardCode !== 'string' || !shipping.ghnWardCode.trim()) {
      throw new BadRequestError('shipping.ghnWardCode is required');
    }

    const cartItemIds = Array.isArray(body.cartItemIds)
      ? body.cartItemIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
      : undefined;
    const voucherCode = typeof body.voucherCode === 'string' ? body.voucherCode.trim() : undefined;

    const result = await this.paymentController.createCodOrder({
      userId,
      amount: body.amount,
      voucherCode: voucherCode || undefined,
      cartItemIds,
      shipping: {
        recipient: String(shipping.recipient).trim(),
        phone: String(shipping.phone).trim(),
        addressLine: String(shipping.addressLine).trim(),
        ward: String(shipping.ward).trim(),
        district: String(shipping.district).trim(),
        city: String(shipping.city).trim(),
        ghnProvinceId: Number(shipping.ghnProvinceId),
        ghnDistrictId: Number(shipping.ghnDistrictId),
        ghnWardCode: String(shipping.ghnWardCode).trim(),
        addressId: typeof shipping.addressId === 'string' ? shipping.addressId.trim() : null,
      },
    });

    res.status(201).json(ResponseFormatter.success(result, 'COD order created successfully'));
  }
}
