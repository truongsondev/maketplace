import express, { Request, Response } from 'express';
import { BadRequestError } from '../../../../error-handlling/badRequestError';
import { ResponseFormatter } from '../../../../shared/server/api-response';
import { asyncHandler } from '../../../../shared/server/error-middleware';
import { parseClientIp } from '../vnpay/request-ip.util';
import { ParsedVnpParams } from '../../applications/dto';
import { PaymentController } from '../../interface-adapter/controller';

function queryToParsedVnpParams(query: Request['query']): ParsedVnpParams {
  const parsed: ParsedVnpParams = {};

  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      parsed[key] = typeof value[0] === 'string' ? value[0] : undefined;
      continue;
    }

    if (typeof value === 'string') {
      parsed[key] = value;
      continue;
    }

    parsed[key] = undefined;
  }

  return parsed;
}

export class PaymentAPI {
  readonly router = express.Router();

  constructor(private readonly paymentController: PaymentController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/vnpay/create-url', asyncHandler(this.createPaymentUrl.bind(this)));
    this.router.get('/vnpay/return', asyncHandler(this.handleVnpReturn.bind(this)));
    this.router.get('/vnpay/ipn', asyncHandler(this.handleVnpIpn.bind(this)));
    this.router.get(
      '/vnpay/orders/:orderCode/status',
      asyncHandler(this.getPaymentStatus.bind(this)),
    );
  }

  private async createPaymentUrl(req: Request, res: Response): Promise<void> {
    const userId = req.userId;
    if (!userId) {
      throw new BadRequestError('User ID not found');
    }

    const {
      amount,
      orderInfo,
      locale = 'vn',
      orderType = 'other',
      bankCode,
    } = req.body as {
      amount?: number;
      orderInfo?: string;
      locale?: 'vn' | 'en';
      orderType?: string;
      bankCode?: string;
    };

    if (typeof amount !== 'number') {
      throw new BadRequestError('amount must be a number');
    }

    if (!orderInfo || typeof orderInfo !== 'string') {
      throw new BadRequestError('orderInfo is required');
    }

    const requestIp = parseClientIp(req);

    const result = await this.paymentController.createPaymentUrl(
      {
        userId,
        amount,
        orderInfo,
        locale,
        orderType,
        bankCode,
      },
      requestIp,
    );

    res
      .status(201)
      .json(ResponseFormatter.success(result, 'VNPAY payment URL created successfully'));
  }

  private async handleVnpReturn(req: Request, res: Response): Promise<void> {
    const query = queryToParsedVnpParams(req.query);
    const result = this.paymentController.handleVnpReturn(query);

    res.status(200).json(ResponseFormatter.success(result));
  }

  private async handleVnpIpn(req: Request, res: Response): Promise<void> {
    const query = queryToParsedVnpParams(req.query);
    const result = await this.paymentController.handleVnpIpn(query);

    // VNPAY requires the plain response format: {"RspCode":"xx","Message":"..."}
    res.status(200).json(result);
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
