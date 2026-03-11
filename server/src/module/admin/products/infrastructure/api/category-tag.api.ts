import express, { Request, Response, NextFunction } from 'express';
import { ResponseFormatter } from '../../../../../shared/server/api-response';
import { asyncHandler } from '../../../../../shared/server/error-middleware';
import { CategoryTagController } from '../../interface-adapter/controller/category-tag.controller';

export class CategoryTagAPI {
  readonly router = express.Router();

  constructor(private readonly categoryTagController: CategoryTagController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/categories', asyncHandler(this.getCategories.bind(this)));
    this.router.get('/tags', asyncHandler(this.getTags.bind(this)));
  }

  private async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    const result = await this.categoryTagController.getCategories({});
    const response = ResponseFormatter.success(result);
    res.status(200).json(response);
  }

  private async getTags(req: Request, res: Response, next: NextFunction): Promise<void> {
    const command = {
      search: req.query.search as string,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    };

    const result = await this.categoryTagController.getTags(command);
    const response = ResponseFormatter.success(result);
    res.status(200).json(response);
  }
}
