import { Request, Response } from 'express';
import { ResponseFormatter } from '../../../../shared/server/api-response';
import { BadRequestError } from '../../../../error-handlling/badRequestError';
import { IGetProductsUseCase } from '../../../product/applications/ports/input/get-products.usecase';

export class PublicProductsController {
  constructor(private readonly getProductsUseCase: IGetProductsUseCase) {}

  async getProducts(req: Request, res: Response): Promise<void> {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

    const getStringParam = (param: any): string | undefined => {
      if (typeof param === 'string') return param;
      if (Array.isArray(param) && param.length > 0) return param[0];
      return undefined;
    };

    const category = getStringParam(req.query.c);
    const size = getStringParam(req.query.s);
    const color = getStringParam(req.query.cl);
    const priceRange = getStringParam(req.query.p);
    const sort = getStringParam(req.query.sort);
    const search = getStringParam(req.query.q) ?? getStringParam(req.query.search);

    if (search && search.length > 120) {
      throw new BadRequestError('search is too long');
    }

    const result = await this.getProductsUseCase.execute({
      page,
      limit,
      category,
      size,
      color,
      priceRange,
      search,
      sort,
    });

    res.status(200).json(ResponseFormatter.success(result, 'Products retrieved successfully'));
  }
}
