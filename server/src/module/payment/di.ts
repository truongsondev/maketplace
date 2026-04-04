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

export function createPaymentModule(): Router {
  const paymentRepository = new PrismaPaymentRepository(prisma);

  const createPayosPaymentLinkUseCase = new CreatePayosPaymentLinkUseCase(paymentRepository);
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
