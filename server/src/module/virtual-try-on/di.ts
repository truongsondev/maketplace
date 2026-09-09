import { Router } from 'express';
import { prisma } from '../../infrastructure/database';
import { AiServiceVirtualTryOnProvider } from './ai-service-virtual-try-on.provider';
import { CloudinaryVirtualTryOnStorage } from './cloudinary-virtual-try-on.storage';
import { PrismaVirtualTryOnRepository } from './prisma-virtual-try-on.repository';
import { AdminVirtualTryOnAPI, VirtualTryOnAPI } from './virtual-try-on.api';
import { VirtualTryOnService } from './virtual-try-on.service';

function createService(): VirtualTryOnService {
  return new VirtualTryOnService(
    new PrismaVirtualTryOnRepository(prisma),
    new AiServiceVirtualTryOnProvider(),
    new CloudinaryVirtualTryOnStorage(),
  );
}

export function createVirtualTryOnModule(): Router {
  return new VirtualTryOnAPI(createService()).router;
}

export function createAdminVirtualTryOnModule(): Router {
  return new AdminVirtualTryOnAPI(createService()).router;
}
