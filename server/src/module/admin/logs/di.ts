import { Router } from 'express';
import { prisma } from '../../../infrastructure/database';
import { ListAdminLogsUseCase } from './applications/use-cases/list-admin-logs.usecase';
import { AdminLogsController } from './interface-adapter/controller/admin-logs.controller';
import { AdminLogsAPI } from './infrastructure/api/admin-logs.api';
import { PrismaAdminLogsRepository } from './infrastructure/repositories/prisma-admin-logs.repository';

export function createAdminLogsModule(): Router {
  const repository = new PrismaAdminLogsRepository(prisma);
  const controller = new AdminLogsController(new ListAdminLogsUseCase(repository));
  const api = new AdminLogsAPI(controller);
  return api.router;
}

export const AdminLogsConnect = createAdminLogsModule;
