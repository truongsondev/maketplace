import { Router } from 'express';
import { prisma } from '../../infrastructure/database';
import {
  CreatePayosPaymentLinkUseCase,
  GetPaymentStatusUseCase,
  HandlePayosReturnUseCase,
  HandlePayosWebhookUseCase,
} from './applications/use-cases';
import { PaymentAPI } from './infrastructure/api';
import { PrismaPaymentRepository } from './infrastructure/repositories';
import { PaymentController } from './interface-adapter/controller';
import { createVoucherCheckoutService } from '../voucher/di';
import { createUserShippingInfoService } from '../address/di';

export function createPaymentModule(): Router {
  const voucherCheckoutService = createVoucherCheckoutService();
  const shippingInfoService = createUserShippingInfoService();
  const paymentRepository = new PrismaPaymentRepository(prisma, voucherCheckoutService);

  const createPayosPaymentLinkUseCase = new CreatePayosPaymentLinkUseCase(
    paymentRepository,
    shippingInfoService,
  );
  const handlePayosReturnUseCase = new HandlePayosReturnUseCase(paymentRepository);
  const handlePayosWebhookUseCase = new HandlePayosWebhookUseCase(paymentRepository);
  const getPaymentStatusUseCase = new GetPaymentStatusUseCase(paymentRepository);

  const controller = new PaymentController(
    createPayosPaymentLinkUseCase,
    handlePayosReturnUseCase,
    handlePayosWebhookUseCase,
    getPaymentStatusUseCase,
  );

  const paymentAPI = new PaymentAPI(controller);
  return paymentAPI.router;
}
