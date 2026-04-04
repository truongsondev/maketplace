import express, { Request, Response } from 'express';
import { ResponseFormatter } from '../../../../shared/server/api-response';
import { HttpErrorHandler } from '../../../../shared/server/http-error-handler';
import { asyncHandler } from '../../../../shared/server/error-middleware';
import { CartController } from '../../interface-adapter/controller/cart.controller';
import { BadRequestError } from '../../../../error-handlling/badRequestError';
import { NotFoundError } from '../../../../error-handlling/notFoundError';
import { ConflicError } from '../../../../error-handlling/conflicError';
import {
  CartItemNotFoundError,
  VariantRequiredError,
  VariantNotFoundError,
  ProductNotFoundError,
  InsufficientStockError,
  ExceedsMaxQuantityError,
  InvalidQuantityError,
} from '../../applications/errors';

export class CartAPI {
  readonly router = express.Router();

  constructor(private readonly cartController: CartController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Note: Auth middleware will be applied at app level for /api/cart routes
    this.router.get('/', asyncHandler(this.getCart.bind(this)));
    this.router.get('/summary', asyncHandler(this.getCartSummary.bind(this)));
    this.router.post('/items', asyncHandler(this.addToCart.bind(this)));
    this.router.patch('/items/:itemId', asyncHandler(this.updateCartItem.bind(this)));
    this.router.delete('/items/:itemId', asyncHandler(this.removeCartItem.bind(this)));
  }

  private async getCart(req: Request, res: Response): Promise<void> {
    const userId = req.userId;

    if (!userId) {
      throw new BadRequestError('User ID not found');
    }

    const result = await this.cartController.getCart(userId);
    const response = ResponseFormatter.success(result, 'Cart retrieved successfully');
    res.status(200).json(response);
  }

  private async getCartSummary(req: Request, res: Response): Promise<void> {
    const userId = req.userId;

    if (!userId) {
      throw new BadRequestError('User ID not found');
    }

    const result = await this.cartController.getCartSummary(userId);
    const response = ResponseFormatter.success(result, 'Cart summary retrieved successfully');
    res.status(200).json(response);
  }

  private async addToCart(req: Request, res: Response): Promise<void> {
    const { variantId, quantity } = req.body;
    const userId = req.userId;

    if (!userId) {
      throw new BadRequestError('User ID not found');
    }

    HttpErrorHandler.validateRequired({ variantId, quantity }, 'variantId', 'quantity');

    if (typeof variantId !== 'string') {
      throw new BadRequestError('variantId must be a string');
    }

    if (typeof quantity !== 'number' || !Number.isInteger(quantity)) {
      throw new BadRequestError('quantity must be an integer');
    }

    try {
      const result = await this.cartController.addToCart(userId, { variantId, quantity });
      const response = ResponseFormatter.success(result, 'Product added to cart successfully');
      res.status(200).json(response);
    } catch (error) {
      // Map domain errors to HTTP errors
      if (error instanceof VariantRequiredError) {
        throw new BadRequestError(error.message);
      }
      if (error instanceof InvalidQuantityError) {
        throw new BadRequestError(error.message);
      }
      if (error instanceof VariantNotFoundError) {
        throw new NotFoundError(error.message);
      }
      if (error instanceof ProductNotFoundError) {
        throw new NotFoundError(error.message);
      }
      if (error instanceof InsufficientStockError) {
        throw new ConflicError(error.message);
      }
      if (error instanceof ExceedsMaxQuantityError) {
        throw new ConflicError(error.message);
      }
      throw error;
    }
  }

  private async updateCartItem(req: Request, res: Response): Promise<void> {
    const { quantity } = req.body;
    const { itemId } = req.params;
    const userId = req.userId;

    if (!userId) {
      throw new BadRequestError('User ID not found');
    }

    if (!itemId || typeof itemId !== 'string') {
      throw new BadRequestError('itemId is required');
    }

    HttpErrorHandler.validateRequired({ quantity }, 'quantity');

    if (typeof quantity !== 'number' || !Number.isInteger(quantity)) {
      throw new BadRequestError('quantity must be an integer');
    }

    if (quantity <= 0) {
      throw new BadRequestError('quantity must be greater than 0');
    }

    try {
      const result = await this.cartController.updateCartItem(userId, { itemId, quantity });
      const response = ResponseFormatter.success(result, 'Cart item updated successfully');
      res.status(200).json(response);
    } catch (error) {
      if (error instanceof CartItemNotFoundError) {
        throw new NotFoundError(error.message);
      }
      if (error instanceof InvalidQuantityError) {
        throw new BadRequestError(error.message);
      }
      if (error instanceof InsufficientStockError) {
        throw new ConflicError(error.message);
      }
      if (error instanceof ExceedsMaxQuantityError) {
        throw new ConflicError(error.message);
      }
      throw error;
    }
  }

  private async removeCartItem(req: Request, res: Response): Promise<void> {
    const { itemId } = req.params;
    const userId = req.userId;

    if (!userId) {
      throw new BadRequestError('User ID not found');
    }

    if (!itemId || typeof itemId !== 'string') {
      throw new BadRequestError('itemId is required');
    }

    try {
      const result = await this.cartController.removeCartItem(userId, itemId);
      const response = ResponseFormatter.success(result, 'Cart item removed successfully');
      res.status(200).json(response);
    } catch (error) {
      if (error instanceof CartItemNotFoundError) {
        throw new NotFoundError(error.message);
      }
      throw error;
    }
  }
}
