import express, { Request, Response } from 'express';
import { BadRequestError } from '../../../../error-handlling/badRequestError';
import { ResponseFormatter } from '../../../../shared/server/api-response';
import { asyncHandler } from '../../../../shared/server/error-middleware';
import { AddressController } from '../../interface-adapter/controller';

export class AddressAPI {
  readonly router = express.Router();

  constructor(private readonly addressController: AddressController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Note: Auth middleware will be applied at app level for /api/addresses routes
    this.router.get('/', asyncHandler(this.getMyAddresses.bind(this)));
    this.router.get('/last-used', asyncHandler(this.getLastUsedAddress.bind(this)));
  }

  private async getMyAddresses(req: Request, res: Response): Promise<void> {
    const userId = req.userId;

    if (!userId) {
      throw new BadRequestError('User ID not found');
    }

    const result = await this.addressController.getMyAddresses(userId);
    res.status(200).json(ResponseFormatter.success(result, 'Addresses retrieved successfully'));
  }

  private async getLastUsedAddress(req: Request, res: Response): Promise<void> {
    const userId = req.userId;

    if (!userId) {
      throw new BadRequestError('User ID not found');
    }

    const result = await this.addressController.getLastUsedAddress(userId);
    res
      .status(200)
      .json(ResponseFormatter.success(result, 'Last used address retrieved successfully'));
  }
}
