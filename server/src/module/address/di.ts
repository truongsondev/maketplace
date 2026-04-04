import { Router } from 'express';
import { prisma } from '../../infrastructure/database';

import { GetMyAddressesUseCase } from './applications/use-cases';
import { AddressController } from './interface-adapter/controller';
import { AddressAPI } from './infrastructure/api';
import { PrismaAddressRepository } from './infrastructure/repositories';

export function createAddressModule(): Router {
  const addressRepository = new PrismaAddressRepository(prisma);
  const getMyAddressesUseCase = new GetMyAddressesUseCase(addressRepository);

  const addressController = new AddressController(getMyAddressesUseCase);
  const addressAPI = new AddressAPI(addressController);

  return addressAPI.router;
}
