import { Router } from 'express';
import { prisma } from '../../../infrastructure/database';
import { ListAdminNotificationsUseCase } from './applications/use-cases/list-admin-notifications.usecase';
import { MarkAdminNotificationReadUseCase } from './applications/use-cases/mark-admin-notification-read.usecase';
import { MarkAllAdminNotificationsReadUseCase } from './applications/use-cases/mark-all-admin-notifications-read.usecase';
import { AdminNotificationsAPI } from './infrastructure/api/admin-notifications.api';
import { PrismaAdminNotificationsRepository } from './infrastructure/repositories/prisma-admin-notifications.repository';
import { AdminNotificationsController } from './interface-adapter/controller/admin-notifications.controller';

export function createAdminNotificationsModule(): Router {
  const repository = new PrismaAdminNotificationsRepository(prisma);
  const controller = new AdminNotificationsController(
    new ListAdminNotificationsUseCase(repository),
    new MarkAdminNotificationReadUseCase(repository),
    new MarkAllAdminNotificationsReadUseCase(repository),
  );

  const api = new AdminNotificationsAPI(controller);
  return api.router;
}

export const AdminNotificationsConnect = createAdminNotificationsModule;
