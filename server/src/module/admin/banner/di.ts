import { Router } from 'express';
import { prisma } from '../../../infrastructure/database';
import { ListAdminBannersUseCase } from './applications/use-cases/list-admin-banners.usecase';
import { GetAdminBannerByIdUseCase } from './applications/use-cases/get-admin-banner-by-id.usecase';
import { CreateAdminBannerUseCase } from './applications/use-cases/create-admin-banner.usecase';
import { UpdateAdminBannerUseCase } from './applications/use-cases/update-admin-banner.usecase';
import { SetAdminBannerStatusUseCase } from './applications/use-cases/set-admin-banner-status.usecase';
import { GenerateBannerUploadSignatureUseCase } from './applications/use-cases/generate-banner-upload-signature.usecase';
import { AdminBannerController } from './interface-adapter/controller/admin-banner.controller';
import { PrismaAdminBannerRepository } from './infrastructure/repositories/prisma-admin-banner.repository';
import { CloudinaryServiceImpl } from './infrastructure/repositories/cloudinary.service';
import { AdminBannerAPI } from './infrastructure/api/admin-banner.api';

export function createAdminBannerModule(): Router {
  const repository = new PrismaAdminBannerRepository(prisma);
  const cloudinaryService = new CloudinaryServiceImpl();

  const controller = new AdminBannerController(
    new ListAdminBannersUseCase(repository),
    new GetAdminBannerByIdUseCase(repository),
    new CreateAdminBannerUseCase(repository),
    new UpdateAdminBannerUseCase(repository),
    new SetAdminBannerStatusUseCase(repository),
    new GenerateBannerUploadSignatureUseCase(cloudinaryService),
  );

  const api = new AdminBannerAPI(controller);
  return api.router;
}

export const AdminBannerConnect = createAdminBannerModule;
