import { describe, expect, it } from '@jest/globals';
import { ChatbotLLMOrchestratorService } from '../chatbot-llm-orchestrator.service';
import type {
  ChatbotIntentClassification,
  ChatbotLLMResponse,
  IChatbotLLMClient,
} from '../../ports/output/chatbot-llm-client';
import type { ChatSessionRecord } from '../../ports/output/chat-session.repository';
import type { ChatbotCatalogProduct } from '../../ports/output/chatbot-product-catalog';
import { SearchProductsTool } from '../../tools/search-products.tool';

type GenerateParams = Parameters<IChatbotLLMClient['generate']>[0];
type ClassifyParams = Parameters<IChatbotLLMClient['classifyIntent']>[0];

class FakeLLMClient implements IChatbotLLMClient {
  readonly generateCalls: GenerateParams[] = [];
  readonly classifyCalls: ClassifyParams[] = [];

  constructor(
    private readonly classifications: ChatbotIntentClassification[],
    private readonly responses: ChatbotLLMResponse[],
  ) {}

  async classifyIntent(params: ClassifyParams): Promise<ChatbotIntentClassification> {
    this.classifyCalls.push(params);
    return this.classifications.shift() ?? { intent: 'out_of_scope', confidence: 0 };
  }

  async generate(params: GenerateParams): Promise<ChatbotLLMResponse> {
    this.generateCalls.push(params);
    return this.responses.shift() ?? { text: '', functionCalls: [] };
  }
}

function makeSession(content: string): ChatSessionRecord {
  return {
    id: 'session-1',
    userId: 'user-1',
    status: 'OPEN',
    guestToken: null,
    leadName: null,
    leadPhone: null,
    leadEmail: null,
    budgetMin: null,
    budgetMax: null,
    shopperProfile: null,
    lastIntent: null,
    lastSummary: null,
    lastSuggestedProductIds: [],
    lastMessageAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    messages: [
      {
        id: 'message-1',
        role: 'USER',
        content,
        metadata: null,
        createdAt: new Date(),
      },
    ],
  };
}

function makeSearchProductsTool(products: ChatbotCatalogProduct[] = []): SearchProductsTool {
  return new SearchProductsTool({
    searchProducts: async () => products,
  });
}

function makeOrchestrator(
  llmClient: IChatbotLLMClient,
  searchProductsTool = makeSearchProductsTool(),
) {
  return new ChatbotLLMOrchestratorService(llmClient, searchProductsTool, {
    enabled: true,
    provider: 'gemini',
    model: 'gemini-test',
    maxToolCalls: 3,
  });
}

describe('ChatbotLLMOrchestratorService', () => {
  it('routes greeting through the Gemini intent classifier without product search', async () => {
    const llmClient = new FakeLLMClient(
      [{ intent: 'greeting', confidence: 0.97 }],
      [
        {
          text: 'Mình là AURA Sales AI, trợ lý chọn đồ của shop. Bạn muốn tìm đồ theo dịp nào?',
          functionCalls: [],
        },
      ],
    );
    const orchestrator = makeOrchestrator(llmClient);

    const reply = await orchestrator.buildReply(makeSession('Bạn là ai'), 'Bạn là ai');

    expect(reply.content).toContain('AURA Sales AI');
    expect(reply.lastIntent).toBe('greeting');
    expect(reply.suggestedProducts).toHaveLength(0);
    expect(llmClient.classifyCalls).toHaveLength(1);
    expect(llmClient.generateCalls).toHaveLength(1);
    expect(llmClient.generateCalls[0].enableTools).toBe(false);
  });

  it('uses extracted product filters to query the real product tool before answering', async () => {
    const product: ChatbotCatalogProduct = {
      id: 'prod-1',
      name: 'Áo sơ mi trắng',
      imageUrl: null,
      minPrice: 399000,
      href: '/product/prod-1',
      categorySlugs: ['ao-so-mi'],
      usageOccasions: ['di_lam'],
    };
    const llmClient = new FakeLLMClient(
      [
        {
          intent: 'product_search',
          confidence: 0.95,
          filters: {
            keyword: 'áo sơ mi',
            category: 'ao-so-mi',
            color: 'trắng',
            size: 'M',
            budgetMin: null,
            budgetMax: 500000,
            occasion: 'di_lam',
            style: null,
            gender: null,
          },
        },
      ],
      [
        {
          text: 'Mình thấy Áo sơ mi trắng khá hợp nhu cầu đi làm của bạn.',
          functionCalls: [],
        },
      ],
    );
    const orchestrator = makeOrchestrator(llmClient, makeSearchProductsTool([product]));

    const reply = await orchestrator.buildReply(
      makeSession('Gợi ý áo sơ mi trắng size M dưới 500k đi làm'),
      'Gợi ý áo sơ mi trắng size M dưới 500k đi làm',
    );

    expect(reply.content).toContain('Áo sơ mi trắng');
    expect(reply.lastIntent).toBe('recommend_products');
    expect(reply.suggestedProducts).toEqual([product]);
    expect(reply.shopperProfile).toMatchObject({
      budgetMax: 500000,
      color: 'trắng',
      size: 'M',
      usageOccasion: 'di_lam',
      categoryHint: 'ao-so-mi',
    });
    expect(llmClient.classifyCalls).toHaveLength(1);
    expect(llmClient.generateCalls).toHaveLength(1);
    expect(llmClient.generateCalls[0].enableTools).toBe(false);
  });

  it('falls back to out_of_scope when intent classification fails', async () => {
    const llmClient: IChatbotLLMClient = {
      classifyIntent: async () => {
        throw new Error('classifier down');
      },
      generate: async () => {
        throw new Error('generate should not be called');
      },
    };
    const orchestrator = makeOrchestrator(llmClient);

    const reply = await orchestrator.buildReply(makeSession('bitcoin hôm nay sao'), 'bitcoin hôm nay sao');

    expect(reply.lastIntent).toBe('out_of_scope');
    expect(reply.content).toContain('Mình chỉ là trợ lý AI của AURA');
    expect(reply.suggestedProducts).toHaveLength(0);
  });
});
