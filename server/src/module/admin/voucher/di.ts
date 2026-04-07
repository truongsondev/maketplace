import { Router } from 'express';
import { prisma } from '../../../infrastructure/database';
import { ListAdminVouchersUseCase } from './applications/use-cases/list-admin-vouchers.usecase';
import { GetAdminVoucherByIdUseCase } from './applications/use-cases/get-admin-voucher-by-id.usecase';
import { CreateAdminVoucherUseCase } from './applications/use-cases/create-admin-voucher.usecase';
import { UpdateAdminVoucherUseCase } from './applications/use-cases/update-admin-voucher.usecase';
import { SetAdminVoucherStatusUseCase } from './applications/use-cases/set-admin-voucher-status.usecase';
import { AdminVoucherController } from './interface-adapter/controller/admin-voucher.controller';
import { PrismaAdminVoucherRepository } from './infrastructure/repositories/prisma-admin-voucher.repository';
import { AdminVoucherAPI } from './infrastructure/api/admin-voucher.api';

export function createAdminVoucherModule(): Router {
  const repository = new PrismaAdminVoucherRepository(prisma);
  const controller = new AdminVoucherController(
    new ListAdminVouchersUseCase(repository),
    new GetAdminVoucherByIdUseCase(repository),
    new CreateAdminVoucherUseCase(repository),
    new UpdateAdminVoucherUseCase(repository),
    new SetAdminVoucherStatusUseCase(repository),
  );

  const api = new AdminVoucherAPI(controller);
  return api.router;
}

export const AdminVoucherConnect = createAdminVoucherModule;
