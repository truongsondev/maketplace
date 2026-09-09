import { Router } from 'express';
import { prisma } from '@/infrastructure/database';
import { createLogger } from '@/shared/util/logger';
import { GetProductsUseCase } from '@/module/product/applications/usecases/get-products.usecase';
import { PrismaProductRepository } from '@/module/product/infrastructure/repositories/prisma-product.repository';
import { GetChatSessionUseCase } from './applications/usecases/get-chat-session.usecase';
import { SendChatMessageUseCase } from './applications/usecases/send-chat-message.usecase';
import { StartChatSessionUseCase } from './applications/usecases/start-chat-session.usecase';
import { ChatbotLLMOrchestratorService } from './applications/services/chatbot-llm-orchestrator.service';
import { ChatbotSalesAssistantService } from './applications/services/chatbot-sales-assistant.service';
import { SearchProductsTool } from './applications/tools/search-products.tool';
import { ProductCatalogAdapter } from './infrastructure/catalog/product-catalog.adapter';
import { GeminiChatClient } from './infrastructure/llm/gemini-chat.client';
import { ChatbotAPI } from './infrastructure/api/chatbot.api';
import { PrismaChatSessionRepository } from './infrastructure/repositories/prisma-chat-session.repository';
import { ChatbotController } from './interface-adapter/controller/chatbot.controller';

function readPositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  const value = raw ? Number(raw) : NaN;
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function resolveGeminiModel(rawModel: string | undefined): string {
  const model = rawModel?.trim() || 'gemini-2.5-flash';
  if (
    model === 'gemini-2.0-flash' ||
    model === 'gemini-2.0-flash-001' ||
    model === 'gemini-2.0-flash-exp'
  ) {
    return 'gemini-2.5-flash';
  }

  return model;
}

export function createChatbotModule(): Router {
  const logger = createLogger('ChatbotModule');
  const productRepository = new PrismaProductRepository(prisma);
  const getProductsUseCase = new GetProductsUseCase(productRepository);
  const productCatalog = new ProductCatalogAdapter(getProductsUseCase, prisma);
  const chatSessionRepository = new PrismaChatSessionRepository(prisma);
  const salesAssistant = new ChatbotSalesAssistantService(productCatalog);
  const searchProductsTool = new SearchProductsTool(productCatalog);
  const configuredGeminiModel = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
  const resolvedGeminiModel = resolveGeminiModel(configuredGeminiModel);

  if (resolvedGeminiModel !== configuredGeminiModel) {
    logger.warn('Configured Gemini model is deprecated, switching to a supported replacement', {
      configuredGeminiModel,
      resolvedGeminiModel,
    });
  }

  const geminiClient = new GeminiChatClient({
    apiKey: process.env.GEMINI_API_KEY ?? '',
    baseUrl: process.env.GEMINI_BASE_URL ?? 'https://generativelanguage.googleapis.com/v1beta',
    model: resolvedGeminiModel,
    timeoutMs: readPositiveIntEnv('CHATBOT_LLM_TIMEOUT_MS', 15_000),
  });
  const llmOrchestrator = new ChatbotLLMOrchestratorService(geminiClient, searchProductsTool, {
    enabled: process.env.CHATBOT_LLM_ENABLED === 'true',
    provider: process.env.CHATBOT_LLM_PROVIDER ?? 'gemini',
    model: resolvedGeminiModel,
    maxToolCalls: readPositiveIntEnv('CHATBOT_LLM_MAX_TOOL_CALLS', 3),
  });

  const startChatSessionUseCase = new StartChatSessionUseCase(chatSessionRepository);
  const getChatSessionUseCase = new GetChatSessionUseCase(chatSessionRepository);
  const sendChatMessageUseCase = new SendChatMessageUseCase(
    chatSessionRepository,
    salesAssistant,
    llmOrchestrator,
  );

  const controller = new ChatbotController(
    startChatSessionUseCase,
    getChatSessionUseCase,
    sendChatMessageUseCase,
  );

  return new ChatbotAPI(controller).router;
}
