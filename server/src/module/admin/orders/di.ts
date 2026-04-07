import { Router } from 'express';
import { prisma } from '../../../infrastructure/database';
import { AdminOrdersAPI } from './infrastructure/api/admin-orders.api';
import { PrismaAdminOrderReturnRepository } from './infrastructure/repositories/prisma-admin-order-return.repository';
import { ApproveReturnsUseCase } from './applications/use-cases/approve-returns.usecase';
import { RejectReturnsUseCase } from './applications/use-cases/reject-returns.usecase';
import { MarkReturnPickedUpUseCase } from './applications/use-cases/mark-return-picked.usecase';
import { CompleteReturnUseCase } from './applications/use-cases/complete-return.usecase';
import { AdminOrderReturnsController } from './interface-adapter/controller/admin-order-returns.controller';

export function createAdminOrdersModule(): Router {
  const returnRepo = new PrismaAdminOrderReturnRepository(prisma);
  const controller = new AdminOrderReturnsController(
    new ApproveReturnsUseCase(returnRepo),
    new RejectReturnsUseCase(returnRepo),
    new MarkReturnPickedUpUseCase(returnRepo),
    new CompleteReturnUseCase(returnRepo),
  );

  const api = new AdminOrdersAPI(prisma, controller);
  return api.router;
}

export const AdminOrdersConnect = createAdminOrdersModule;
