import { Router } from 'express';
import { prisma } from '../../../infrastructure/database';
import { GetAdminRefundByIdUseCase } from './applications/use-cases/get-admin-refund-by-id.usecase';
import { ListAdminRefundsUseCase } from './applications/use-cases/list-admin-refunds.usecase';
import { RetryAdminRefundUseCase } from './applications/use-cases/retry-admin-refund.usecase';
import { AdminRefundController } from './interface-adapter/controller/admin-refund.controller';
import { AdminRefundAPI } from './infrastructure/api/admin-refund.api';
import { PrismaAdminRefundRepository } from './infrastructure/repositories/prisma-admin-refund.repository';

export function createAdminRefundModule(): Router {
  const repository = new PrismaAdminRefundRepository(prisma);
  const controller = new AdminRefundController(
    new ListAdminRefundsUseCase(repository),
    new GetAdminRefundByIdUseCase(repository),
    new RetryAdminRefundUseCase(repository),
  );

  const api = new AdminRefundAPI(controller);
  return api.router;
}

export const AdminRefundConnect = createAdminRefundModule;
