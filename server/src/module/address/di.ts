import { Router } from 'express';
import { prisma, redis } from '../../infrastructure/database';

import { GetLastUsedAddressUseCase, GetMyAddressesUseCase } from './applications/use-cases';
import { AddressController } from './interface-adapter/controller';
import { AddressAPI } from './infrastructure/api';
import { PrismaAddressRepository } from './infrastructure/repositories';
import { UserShippingInfoService } from './applications/services/user-shipping-info.service';

export function createUserShippingInfoService(): UserShippingInfoService {
  const addressRepository = new PrismaAddressRepository(prisma);
  return new UserShippingInfoService(addressRepository, redis);
}

export function createAddressModule(): Router {
  const addressRepository = new PrismaAddressRepository(prisma);
  const getMyAddressesUseCase = new GetMyAddressesUseCase(addressRepository);
  const shippingInfoService = new UserShippingInfoService(addressRepository, redis);
  const getLastUsedAddressUseCase = new GetLastUsedAddressUseCase(shippingInfoService);

  const addressController = new AddressController(getMyAddressesUseCase, getLastUsedAddressUseCase);
  const addressAPI = new AddressAPI(addressController);

  return addressAPI.router;
}
