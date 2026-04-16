import { Request, Response } from 'express';
import {
  GetCategoriesQuery,
  GetProductTypeSchemaQuery,
  GetTagsQuery,
  IGetCategoriesUseCase,
  IGetProductTypeSchemaUseCase,
  IGetTagsUseCase,
} from '../../applications';
import { ResponseFormatter } from '@/shared/server/api-response';

export class CommonController {
  constructor(
    private readonly getCategoriesUseCase: IGetCategoriesUseCase,
    private readonly getTagsUseCase: IGetTagsUseCase,
    private readonly getProductTypeSchemaUseCase: IGetProductTypeSchemaUseCase,
  ) {}

  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const query: GetCategoriesQuery = {};

      const result = await this.getCategoriesUseCase.execute(query);

      res.json(ResponseFormatter.success(result, 'Categories retrieved successfully'));
    } catch (error) {
      throw error; // Let error middleware handle it
    }
  }

  async getTags(req: Request, res: Response): Promise<void> {
    try {
      const query: GetTagsQuery = {
        search: req.query.search as string,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        offset: req.query.offset ? Number(req.query.offset) : undefined,
      };

      const result = await this.getTagsUseCase.execute(query);

      res.json(ResponseFormatter.success(result, 'Tags retrieved successfully'));
    } catch (error) {
      throw error; // Let error middleware handle it
    }
  }

  async getProductTypeSchema(req: Request, res: Response): Promise<void> {
    try {
      const query: GetProductTypeSchemaQuery = {
        categoryId: String(req.query.categoryId ?? ''),
      };

      const result = await this.getProductTypeSchemaUseCase.execute(query);
      res.json(ResponseFormatter.success(result, 'Product type schema retrieved successfully'));
    } catch (error) {
      throw error;
    }
  }
}
