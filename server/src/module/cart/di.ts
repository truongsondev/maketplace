import { Router } from 'express';
import { prisma } from '../../infrastructure/database';

import {
  AddToCartUseCase,
  GetCartUseCase,
  UpdateCartItemUseCase,
  RemoveCartItemUseCase,
} from './applications/use-cases';
import { CartController } from './interface-adapter/controller';
import { CartAPI } from './infrastructure/api';
import {
  PrismaCartRepository,
  PrismaVariantRepository,
  PrismaProductImageRepository,
} from './infrastructure/repositories';

export function createCartModule(): Router {
  // Repositories
  const cartRepository = new PrismaCartRepository(prisma);
  const variantRepository = new PrismaVariantRepository(prisma);
  const productImageRepository = new PrismaProductImageRepository(prisma);

  // Use Cases
  const addToCartUseCase = new AddToCartUseCase(
    cartRepository,
    variantRepository,
    productImageRepository,
  );
  const getCartUseCase = new GetCartUseCase(cartRepository, productImageRepository);
  const updateCartItemUseCase = new UpdateCartItemUseCase(
    cartRepository,
    variantRepository,
    productImageRepository,
  );
  const removeCartItemUseCase = new RemoveCartItemUseCase(
    cartRepository,
    variantRepository,
    productImageRepository,
  );

  // Controller
  const cartController = new CartController(
    addToCartUseCase,
    getCartUseCase,
    updateCartItemUseCase,
    removeCartItemUseCase,
  );

  // API
  const cartAPI = new CartAPI(cartController);

  return cartAPI.router;
}
