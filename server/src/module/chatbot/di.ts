import { Router } from 'express';
import { prisma } from '@/infrastructure/database';
import { GetProductsUseCase } from '@/module/product/applications/usecases/get-products.usecase';
import { PrismaProductRepository } from '@/module/product/infrastructure/repositories/prisma-product.repository';
import { GetChatSessionUseCase } from './applications/usecases/get-chat-session.usecase';
import { SendChatMessageUseCase } from './applications/usecases/send-chat-message.usecase';
import { StartChatSessionUseCase } from './applications/usecases/start-chat-session.usecase';
import { ChatbotSalesAssistantService } from './applications/services/chatbot-sales-assistant.service';
import { ProductCatalogAdapter } from './infrastructure/catalog/product-catalog.adapter';
import { ChatbotAPI } from './infrastructure/api/chatbot.api';
import { PrismaChatSessionRepository } from './infrastructure/repositories/prisma-chat-session.repository';
import { ChatbotController } from './interface-adapter/controller/chatbot.controller';

export function createChatbotModule(): Router {
  const productRepository = new PrismaProductRepository(prisma);
  const getProductsUseCase = new GetProductsUseCase(productRepository);
  const productCatalog = new ProductCatalogAdapter(getProductsUseCase, prisma);
  const chatSessionRepository = new PrismaChatSessionRepository(prisma);
  const salesAssistant = new ChatbotSalesAssistantService(productCatalog);

  const startChatSessionUseCase = new StartChatSessionUseCase(chatSessionRepository);
  const getChatSessionUseCase = new GetChatSessionUseCase(chatSessionRepository);
  const sendChatMessageUseCase = new SendChatMessageUseCase(
    chatSessionRepository,
    salesAssistant,
  );

  const controller = new ChatbotController(
    startChatSessionUseCase,
    getChatSessionUseCase,
    sendChatMessageUseCase,
  );

  return new ChatbotAPI(controller).router;
}
