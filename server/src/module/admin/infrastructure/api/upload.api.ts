import express, { Request, Response } from 'express';
import { ResponseFormatter } from '../../../../shared/server/api-response';
import { HttpErrorHandler } from '../../../../shared/server/http-error-handler';
import { BadRequestError } from '../../../../error-handlling/badRequestError';
import { asyncHandler } from '../../../../shared/server/error-middleware';
import { UploadController } from '../../interface-adapter/controller/upload.controller';
import {
  GenerateSignatureCommand,
  SaveProductImageCommand,
  DeleteProductImageCommand,
} from '../../applications/dto';

export class UploadAPI {
  readonly router = express.Router();

  constructor(private readonly uploadController: UploadController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/cloudinary/sign', asyncHandler(this.generateSignature.bind(this)));
    this.router.post('/products/:id/images', asyncHandler(this.saveProductImage.bind(this)));
    this.router.delete(
      '/products/:productId/images/:imageId',
      asyncHandler(this.deleteProductImage.bind(this)),
    );
  }

  private validateGenerateSignatureInput(body: any): void {
    if (body.productId && typeof body.productId !== 'string') {
      throw new BadRequestError('Product ID must be a string');
    }
  }

  private validateSaveProductImageInput(body: any): void {
    const { url, publicId } = body;

    HttpErrorHandler.validateRequired({ url, publicId }, 'url', 'publicId');

    if (typeof url !== 'string' || url.trim().length === 0) {
      throw new BadRequestError('URL must be a non-empty string');
    }

    if (typeof publicId !== 'string' || publicId.trim().length === 0) {
      throw new BadRequestError('Public ID must be a non-empty string');
    }

    if (body.isPrimary !== undefined && typeof body.isPrimary !== 'boolean') {
      throw new BadRequestError('isPrimary must be a boolean');
    }

    if (body.sortOrder !== undefined && typeof body.sortOrder !== 'number') {
      throw new BadRequestError('sortOrder must be a number');
    }
  }

  private validateDeleteProductImageInput(body: any): void {
    const { publicId } = body;

    HttpErrorHandler.validateRequired({ publicId }, 'publicId');

    if (typeof publicId !== 'string' || publicId.trim().length === 0) {
      throw new BadRequestError('Public ID must be a non-empty string');
    }
  }

  private async generateSignature(req: Request, res: Response): Promise<void> {
    this.validateGenerateSignatureInput(req.body);

    const command: GenerateSignatureCommand = {
      productId: req.body.productId,
    };

    const result = this.uploadController.generateSignature(command);
    res.json(ResponseFormatter.success(result, 'Signature generated successfully'));
  }

  private async saveProductImage(req: Request, res: Response): Promise<void> {
    this.validateSaveProductImageInput(req.body);

    const command: SaveProductImageCommand = {
      productId: req.params.id as string,
      url: req.body.url,
      altText: req.body.altText,
      isPrimary: req.body.isPrimary,
      sortOrder: req.body.sortOrder,
    };

    const result = await this.uploadController.saveProductImage(command);
    res.status(201).json(ResponseFormatter.success(result, result.message));
  }

  private async deleteProductImage(req: Request, res: Response): Promise<void> {
    this.validateDeleteProductImageInput(req.body);

    const command: DeleteProductImageCommand = {
      imageId: req.params.imageId as string,
      publicId: req.body.publicId,
    };

    const result = await this.uploadController.deleteProductImage(command);
    res.json(ResponseFormatter.success(result, result.message));
  }
}
