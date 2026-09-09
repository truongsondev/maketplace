import { Router } from 'express';
import { prisma } from '../../../infrastructure/database';
import { ExportAdminUsersUseCase } from './applications/use-cases/export-admin-users.usecase';
import { GetAdminUserByIdUseCase } from './applications/use-cases/get-admin-user-by-id.usecase';
import { GetAdminUserCustomerCohortsUseCase } from './applications/use-cases/get-admin-user-customer-cohorts.usecase';
import { GetAdminUserTopSpendersUseCase } from './applications/use-cases/get-admin-user-top-spenders.usecase';
import { ListAdminUserAuditsUseCase } from './applications/use-cases/list-admin-user-audits.usecase';
import { ListAdminUsersUseCase } from './applications/use-cases/list-admin-users.usecase';
import { SetAdminUserRoleUseCase } from './applications/use-cases/set-admin-user-role.usecase';
import { SetAdminUserStatusUseCase } from './applications/use-cases/set-admin-user-status.usecase';
import { AdminUserAnalyticsController } from './interface-adapter/controller/admin-user-analytics.controller';
import { AdminUsersController } from './interface-adapter/controller/admin-users.controller';
import { AdminUsersAPI } from './infrastructure/api/admin-users.api';
import { PrismaAdminUserAnalyticsRepository } from './infrastructure/repositories/prisma-admin-user-analytics.repository';
import { PrismaAdminUserManagementRepository } from './infrastructure/repositories/prisma-admin-user-management.repository';

export function createAdminUsersModule(): Router {
  const repository = new PrismaAdminUserManagementRepository(prisma);
  const analyticsRepository = new PrismaAdminUserAnalyticsRepository(prisma);

  const controller = new AdminUsersController(
    new ListAdminUsersUseCase(repository),
    new GetAdminUserByIdUseCase(repository),
    new SetAdminUserStatusUseCase(repository),
    new SetAdminUserRoleUseCase(repository),
    new ListAdminUserAuditsUseCase(repository),
    new ExportAdminUsersUseCase(repository),
  );

  const analyticsController = new AdminUserAnalyticsController(
    new GetAdminUserCustomerCohortsUseCase(analyticsRepository),
    new GetAdminUserTopSpendersUseCase(analyticsRepository),
  );

  const api = new AdminUsersAPI(controller, analyticsController);
  return api.router;
}

export const AdminUsersConnect = createAdminUsersModule;
