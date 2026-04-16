import { Router } from 'express';
import { prisma } from '../../../infrastructure/database';
import { AdminDashboardAPI } from './infrastructure/api/admin-dashboard.api';
import { PrismaAdminDashboardRepository } from './infrastructure/repositories/prisma-admin-dashboard.repository';
import { AdminDashboardController } from './interface-adapter/controller/admin-dashboard.controller';
import { GetAdminDashboardOverviewUseCase } from './applications/use-cases/get-admin-dashboard-overview.usecase';
import { GetAdminDashboardTimeseriesUseCase } from './applications/use-cases/get-admin-dashboard-timeseries.usecase';
import { GetAdminDashboardRecentOrdersUseCase } from './applications/use-cases/get-admin-dashboard-recent-orders.usecase';

export function createAdminDashboardModule(): Router {
  const repo = new PrismaAdminDashboardRepository(prisma);

  const controller = new AdminDashboardController(
    new GetAdminDashboardOverviewUseCase(repo),
    new GetAdminDashboardTimeseriesUseCase(repo),
    new GetAdminDashboardRecentOrdersUseCase(repo),
  );

  const api = new AdminDashboardAPI(controller);
  return api.router;
}

export const AdminDashboardConnect = createAdminDashboardModule;
