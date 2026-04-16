import express, { Request, Response } from 'express';
import { BadRequestError } from '../../../../error-handlling/badRequestError';
import { ResponseFormatter } from '../../../../shared/server/api-response';
import { asyncHandler } from '../../../../shared/server/error-middleware';
import { createLogger } from '../../../../shared/util/logger';
import { PaymentController } from '../../interface-adapter/controller';

const logger = createLogger('PaymentAPI');

export class PaymentAPI {
  readonly router = express.Router();

  constructor(private readonly paymentController: PaymentController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/payos/create-link', asyncHandler(this.createPayosPaymentLink.bind(this)));
    this.router.get('/payos/return', asyncHandler(this.handlePayosReturn.bind(this)));
    this.router.post('/payos/webhook', asyncHandler(this.handlePayosWebhook.bind(this)));
    this.router.get(
      '/payos/orders/:orderCode/status',
      asyncHandler(this.getPaymentStatus.bind(this)),
    );
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

    const shippingRaw = (req.body as any)?.shipping;
    const shippingValue =
      shippingRaw && typeof shippingRaw === 'object'
        ? {
            recipient: (shippingRaw as any).recipient,
            phone: (shippingRaw as any).phone,
            addressLine: (shippingRaw as any).addressLine,
            ward: (shippingRaw as any).ward,
            // Some clients may only send ward + city; default district to ward.
            district: (shippingRaw as any).district ?? (shippingRaw as any).ward,
            city: (shippingRaw as any).city,
            addressId: (shippingRaw as any).addressId,
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
            addressId:
              typeof shippingValue.addressId === 'string'
                ? shippingValue.addressId.trim()
                : (shippingValue.addressId ?? undefined),
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
      hasData: Boolean((req.body as any)?.data),
      hasSignature: Boolean((req.body as any)?.signature),
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
    const { orderCode } = req.params;
    if (!orderCode || typeof orderCode !== 'string') {
      throw new BadRequestError('orderCode is required');
    }

    const result = await this.paymentController.getPaymentStatus(orderCode);
    res.status(200).json(ResponseFormatter.success(result));
  }
}
