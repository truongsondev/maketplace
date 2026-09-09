import { Router } from 'express';
import { prisma } from '../../infrastructure/database';
import { BannerController } from './interface-adapter/controller/banner.controller';
import { PublicBannerAPI } from './infrastructure/api/public-banner.api';
import { PrismaBannerRepository } from './infrastructure/repositories/prisma-banner.repository';
import { ListActiveBannersUseCase } from './applications/use-cases/list-active-banners.usecase';

export function createPublicBannerModule(): Router {
  const repository = new PrismaBannerRepository(prisma);
  const controller = new BannerController(new ListActiveBannersUseCase(repository));
  const api = new PublicBannerAPI(controller);

  return api.router;
}

export const BannerConnect = createPublicBannerModule;
