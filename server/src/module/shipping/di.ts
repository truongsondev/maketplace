import { prisma } from '../../infrastructure/database';
import { createVoucherCheckoutService } from '../voucher/di';
import { CodSettlementService } from '../payment/applications/services/cod-settlement.service';
import { GhnShippingService } from './applications/services/ghn-shipping.service';
import { GhnClient } from './infrastructure/ghn/ghn.client';
import { getGhnConfig } from './infrastructure/ghn/ghn.config';
import { createGhnAdminRouter, createGhnCustomerRouter, createGhnMasterDataRouter, createGhnWebhookRouter } from './infrastructure/api/ghn-shipping.api';

const config = getGhnConfig();
const client = new GhnClient(config);
const service = new GhnShippingService(prisma, client, config, new CodSettlementService(prisma, createVoucherCheckoutService()));

export const isGhnEnabled = () => config.enabled;
export const createGhnMasterDataModule = () => createGhnMasterDataRouter(client);
export const createGhnWebhookModule = () => createGhnWebhookRouter(service, config);
export const createGhnAdminModule = () => createGhnAdminRouter(service);
export const createGhnCustomerModule = () => createGhnCustomerRouter(service, prisma);
