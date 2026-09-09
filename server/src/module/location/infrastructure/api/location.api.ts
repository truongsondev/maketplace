import express, { Request, Response } from 'express';
import { asyncHandler } from '../../../../shared/server/error-middleware';
import { ResponseFormatter } from '../../../../shared/server/api-response';
import { BadRequestError } from '../../../../error-handlling/badRequestError';
import { loadVietnamLocations } from '../vietnam-locations.store';

export class LocationAPI {
  readonly router = express.Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Public endpoints - served from local JSON file
    this.router.get('/provinces', asyncHandler(this.getProvinces.bind(this)));
    this.router.get('/wards', asyncHandler(this.getWardsByProvince.bind(this)));
  }

  private async getProvinces(_req: Request, res: Response): Promise<void> {
    const provinces = await loadVietnamLocations();

    const items = provinces
      .map((p) => ({ code: p.code, name: p.name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'));

    res.status(200).json(ResponseFormatter.success({ items }));
  }

  private async getWardsByProvince(req: Request, res: Response): Promise<void> {
    const provinceCodeRaw = String(req.query.provinceCode ?? '').trim();
    const provinceCode = Number(provinceCodeRaw);

    if (!Number.isFinite(provinceCode)) {
      throw new BadRequestError('provinceCode is required');
    }

    const provinces = await loadVietnamLocations();
    const province = provinces.find((p) => p.code === provinceCode);

    if (!province) {
      throw new BadRequestError('province not found');
    }

    const items = [...(province.wards ?? [])]
      .map((w) => ({ code: w.code, name: w.name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'));

    res.status(200).json(ResponseFormatter.success({ items }));
  }
}
