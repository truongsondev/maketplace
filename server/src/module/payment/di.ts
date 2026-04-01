import { Router } from 'express';
import { prisma } from '../../infrastructure/database';
import {
  CreateVnpayPaymentUrlUseCase,
  GetPaymentStatusUseCase,
  HandleVnpayIpnUseCase,
  HandleVnpayReturnUseCase,
} from './applications/use-cases';
import { PaymentAPI } from './infrastructure/api';
import { PrismaPaymentRepository } from './infrastructure/repositories';
import { PaymentController } from './interface-adapter/controller';

export function createPaymentModule(): Router {
  const paymentRepository = new PrismaPaymentRepository(prisma);

  const createPaymentUrlUseCase = new CreateVnpayPaymentUrlUseCase(paymentRepository);
  const handleVnpReturnUseCase = new HandleVnpayReturnUseCase();
  const handleVnpIpnUseCase = new HandleVnpayIpnUseCase(paymentRepository);
  const getPaymentStatusUseCase = new GetPaymentStatusUseCase(paymentRepository);

  const controller = new PaymentController(
    createPaymentUrlUseCase,
    handleVnpReturnUseCase,
    handleVnpIpnUseCase,
    getPaymentStatusUseCase,
  );

  const paymentAPI = new PaymentAPI(controller);
  return paymentAPI.router;
}
