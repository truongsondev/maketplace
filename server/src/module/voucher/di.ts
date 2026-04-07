import { Router } from 'express';
import { prisma } from '../../infrastructure/database';
import { VoucherAPI } from './infrastructure/api/voucher.api';
import { PublicVoucherAPI } from './infrastructure/api/public-voucher.api';
import { ListActiveVouchersUseCase, ValidateVoucherUseCase } from './applications/use-cases';
import { VoucherController } from './interface-adapter/controller/voucher.controller';
import { PrismaVoucherRepository } from './infrastructure/repositories/prisma-voucher.repository';
import { VoucherCheckoutService } from './applications/services/voucher-checkout.service';

function createVoucherController(): VoucherController {
  const voucherRepository = new PrismaVoucherRepository(prisma);

  const listActiveVouchersUseCase = new ListActiveVouchersUseCase(voucherRepository);
  const validateVoucherUseCase = new ValidateVoucherUseCase(voucherRepository);

  return new VoucherController(listActiveVouchersUseCase, validateVoucherUseCase);
}

export function createVoucherModule(): Router {
  const api = new VoucherAPI(createVoucherController());
  return api.router;
}

export function createPublicVoucherModule(): Router {
  const api = new PublicVoucherAPI(createVoucherController());
  return api.router;
}

export function createVoucherCheckoutService(): VoucherCheckoutService {
  const voucherRepository = new PrismaVoucherRepository(prisma);
  return new VoucherCheckoutService(voucherRepository);
}
