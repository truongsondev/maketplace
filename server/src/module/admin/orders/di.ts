import { Router } from 'express';
import { prisma } from '../../../infrastructure/database';
import { AdminOrdersAPI } from './infrastructure/api/admin-orders.api';
import { PrismaAdminOrderAnalyticsRepository } from './infrastructure/repositories/prisma-admin-order-analytics.repository';
import { PrismaAdminOrderReturnRepository } from './infrastructure/repositories/prisma-admin-order-return.repository';
import { GetAdminOrderStatusBreakdownUseCase } from './applications/use-cases/get-admin-order-status-breakdown.usecase';
import { GetAdminOrderTimeseriesUseCase } from './applications/use-cases/get-admin-order-timeseries.usecase';
import { ApproveReturnsUseCase } from './applications/use-cases/approve-returns.usecase';
import { RejectReturnsUseCase } from './applications/use-cases/reject-returns.usecase';
import { MarkReturnPickedUpUseCase } from './applications/use-cases/mark-return-picked.usecase';
import { CompleteReturnUseCase } from './applications/use-cases/complete-return.usecase';
import { AdminOrderReturnsController } from './interface-adapter/controller/admin-order-returns.controller';
import { AdminOrderAnalyticsController } from './interface-adapter/controller/admin-order-analytics.controller';

export function createAdminOrdersModule(): Router {
  const returnRepo = new PrismaAdminOrderReturnRepository(prisma);
  const analyticsRepo = new PrismaAdminOrderAnalyticsRepository(prisma);

  const controller = new AdminOrderReturnsController(
    new ApproveReturnsUseCase(returnRepo),
    new RejectReturnsUseCase(returnRepo),
    new MarkReturnPickedUpUseCase(returnRepo),
    new CompleteReturnUseCase(returnRepo),
  );

  const analyticsController = new AdminOrderAnalyticsController(
    new GetAdminOrderStatusBreakdownUseCase(analyticsRepo),
    new GetAdminOrderTimeseriesUseCase(analyticsRepo),
  );

  const api = new AdminOrdersAPI(prisma, controller, analyticsController);
  return api.router;
}

export const AdminOrdersConnect = createAdminOrdersModule;
